import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY);

const BRAND_TEMPLATE_ID = "EAHN0fdLw8k";

const CHANNEL_GUIDE = {
  instagram: "Instagram carousel (4-6 slides). Bold headlines, short punchy body. Visual-first. End with a strong CTA.",
  tiktok:    "TikTok slideshow (4-5 slides). Hook-first — first slide must stop the scroll. Fast, energetic copy.",
  reddit:    "Reddit carousel (4-5 slides). Informative, value-first. No hard sell. End with a community question.",
  x:         "X/Twitter thread slides (4-5 slides). Punchy. One idea per slide. Last slide is the CTA or hot take.",
};

// channel → posts.format enum value
const FORMAT_MAP = {
  instagram: "ig_carousel",
  tiktok:    "tiktok_script",
  reddit:    "reddit_text",
  x:         "x_post",
};

// ── Canva token ───────────────────────────────────────────────────────────────

async function getCanvaToken(accountId) {
  const { data: sa } = await supabase
    .from("social_accounts")
    .select("oauth_access_token, oauth_refresh_token, token_expires_at")
    .eq("account_id", accountId)
    .eq("provider", "canva")
    .eq("status", "connected")
    .single();

  if (!sa) throw new Error("Canva not connected. Visit /api/canva-auth first.");

  const expiresAt = new Date(sa.token_expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) return sa.oauth_access_token;

  const creds = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64");
  const resp  = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${creds}` },
    body:    new URLSearchParams({ grant_type: "refresh_token", refresh_token: sa.oauth_refresh_token }),
  });
  if (!resp.ok) throw new Error(`Token refresh failed: ${await resp.text()}`);

  const { access_token, refresh_token, expires_in } = await resp.json();
  await supabase.from("social_accounts")
    .update({ oauth_access_token: access_token, oauth_refresh_token: refresh_token,
              token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString() })
    .eq("account_id", accountId).eq("provider", "canva");

  return access_token;
}

// ── Canva REST helpers ────────────────────────────────────────────────────────

const canvaH = (token) => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });

// Create a design from the brand template with autofilled heading + body
async function autofillSlide(token, slide) {
  // Step 1: kick off autofill job
  const resp = await fetch(
    `https://api.canva.com/rest/v1/brand-templates/${BRAND_TEMPLATE_ID}/autofills`,
    {
      method: "POST", headers: canvaH(token),
      body: JSON.stringify({
        title: slide.heading.slice(0, 50),
        data: [
          { name: "heading", type: "text", text: slide.heading },
          { name: "body",    type: "text", text: slide.body },
        ],
      }),
    }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`autofill (${resp.status}): ${text}`);
  const { job } = JSON.parse(text);

  // Step 2: poll until the autofill design is ready
  let designId = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(
      `https://api.canva.com/rest/v1/brand-templates/${BRAND_TEMPLATE_ID}/autofills/${job.id}`,
      { headers: canvaH(token) }
    );
    const { job: j } = await poll.json();
    if (j.status === "success") { designId = j.result?.design?.id; break; }
    if (j.status === "failed")  throw new Error("Autofill job failed");
  }
  if (!designId) throw new Error("Autofill timed out");

  // Step 3: export the filled design as PNG
  const exportResp = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST", headers: canvaH(token),
    body: JSON.stringify({ design_id: designId, format: { type: "png", export_quality: "regular" } }),
  });
  const exportText = await exportResp.text();
  if (!exportResp.ok) throw new Error(`export (${exportResp.status}): ${exportText}`);
  const { job: exportJob } = JSON.parse(exportText);

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll      = await fetch(`https://api.canva.com/rest/v1/exports/${exportJob.id}`, { headers: canvaH(token) });
    const { job: j } = await poll.json();
    if (j.status === "success") return { designId, exportUrl: j.urls?.[0] ?? null, heading: slide.heading };
    if (j.status === "failed")  throw new Error("Export job failed");
  }
  throw new Error("Export timed out");
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { account_id } = req.body;
  if (!account_id) return res.status(400).json({ error: "account_id required" });

  // Load brand (replaces old 'projects')
  const { data: brand } = await supabase
    .from("brands").select("*").eq("account_id", account_id).single();

  if (!brand)                    return res.status(404).json({ error: "Brand not found. Run /api/analyze first." });
  if (!brand.recommended_channels?.length)
                                 return res.status(400).json({ error: "No channel set. Run /api/analyze first." });

  const channel = brand.recommended_channels[0];

  // 1. Claude generates slide copy
  const message = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [{
      name:        "create_slideshow",
      description: "Create a social media slideshow for the product",
      input_schema: {
        type: "object",
        properties: {
          slides: {
            type:  "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string", description: "Short bold headline (max 8 words)" },
                body:    { type: "string", description: "Supporting copy (max 30 words)" },
              },
              required: ["heading", "body"],
              additionalProperties: false,
            },
            minItems: 4, maxItems: 6,
          },
          caption: { type: "string", description: "Post caption with hashtags (max 150 chars)" },
        },
        required: ["slides", "caption"],
        additionalProperties: false,
      },
    }],
    tool_choice: { type: "tool", name: "create_slideshow" },
    messages: [{
      role:    "user",
      content: `Create a ${channel} slideshow for this ${brand.industry} product.\n\nFormat guide: ${CHANNEL_GUIDE[channel]}\n\nProduct brief:\n${brand.doc_text.slice(0, 6000)}`,
    }],
  });

  const slideData = message.content.find((b) => b.type === "tool_use")?.input;
  if (!slideData) return res.status(500).json({ error: "Claude returned no tool call" });

  // 2. Canva: autofill brand template per slide → export PNG
  const slideExports = [];
  let canvaError = null;

  try {
    const token = await getCanvaToken(account_id);
    for (const slide of slideData.slides) {
      slideExports.push(await autofillSlide(token, slide));
    }
  } catch (err) {
    console.error("Canva error:", err.message);
    canvaError = err.message;
  }

  // 3. Create campaign row (required FK for posts)
  const { data: campaign } = await supabase.from("campaigns").insert({
    account_id,
    name:          `${brand.industry} campaign`,
    goal:          brand.goal ?? "awareness",
    duration_days: 14,
    channels:      [channel],
    status:        "active",
    starts_on:     new Date().toISOString().split("T")[0],
    ends_on:       new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
  }).select().single();

  // 4. Insert one post row per slide into posts.content (ig_carousel shape)
  const postRows = slideData.slides.map((slide, i) => ({
    account_id,
    campaign_id:   campaign.id,
    channel,
    format:        FORMAT_MAP[channel] ?? "ig_carousel",
    status:        "scheduled",
    approval_state:"pending",
    rationale:     `Slide ${i + 1}: AI-generated for ${brand.industry} on ${channel}`,
    content: {
      heading:     slide.heading,
      body:        slide.body,
      caption:     slideData.caption,
      canva_design_id:  slideExports[i]?.designId  ?? null,
      canva_export_url: slideExports[i]?.exportUrl ?? null,
    },
  }));

  const { data: posts } = await supabase.from("posts").insert(postRows).select("id");

  res.json({
    account_id,
    campaign_id:        campaign.id,
    post_ids:           posts?.map((p) => p.id) ?? [],
    slides:             slideData.slides,
    caption:            slideData.caption,
    channel,
    canva_exports: slideExports,
    canva_error:   canvaError,
  });
}

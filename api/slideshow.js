import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMPLATE_ID  = "DAHNyb2h8Qo";
const ELEMENT_IDS  = {
  heading: "PBTqQKYZMcllf3J7-LB0NVQyKCZNTSSb6",
  body:    "PBTqQKYZMcllf3J7-LBGrDT7XqkgdPsmN",
};

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

async function copyTemplate(token, title) {
  const resp = await fetch(`https://api.canva.com/rest/v1/designs/${TEMPLATE_ID}/copies`, {
    method: "POST", headers: canvaH(token),
    body: JSON.stringify({ title: title.slice(0, 50) }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`copyTemplate (${resp.status}): ${text}`);
  const data = JSON.parse(text);
  console.log("copyTemplate:", JSON.stringify(data).slice(0, 200));
  return data.design?.id ?? data.id;
}

async function startSession(token, designId) {
  const resp = await fetch(`https://api.canva.com/rest/v1/designs/${designId}/editing-sessions`, {
    method: "POST", headers: canvaH(token), body: JSON.stringify({}),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`startSession (${resp.status}): ${text}`);
  const data = JSON.parse(text);
  console.log("startSession:", JSON.stringify(data).slice(0, 200));
  return data.editing_session?.id ?? data.session_id ?? data.id;
}

async function replaceText(token, designId, sessionId, heading, body) {
  const resp = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}/editing-sessions/${sessionId}/operations`,
    {
      method: "POST", headers: canvaH(token),
      body: JSON.stringify({
        operations: [
          { type: "replace_text", element_id: ELEMENT_IDS.heading, text: heading },
          { type: "replace_text", element_id: ELEMENT_IDS.body,    text: body },
        ],
      }),
    }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`replaceText (${resp.status}): ${text}`);
}

async function commitSession(token, designId, sessionId) {
  const resp = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}/editing-sessions/${sessionId}/commits`,
    { method: "POST", headers: canvaH(token), body: JSON.stringify({}) }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`commitSession (${resp.status}): ${text}`);
}

async function exportDesign(token, designId) {
  const resp = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST", headers: canvaH(token),
    body: JSON.stringify({ design_id: designId, format: { type: "png", export_quality: "regular" } }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`exportDesign (${resp.status}): ${text}`);
  const { job } = JSON.parse(text);

  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll      = await fetch(`https://api.canva.com/rest/v1/exports/${job.id}`, { headers: canvaH(token) });
    const { job: j } = await poll.json();
    if (j.status === "success") return j.urls?.[0] ?? null;
    if (j.status === "failed")  throw new Error("Export job failed");
  }
  throw new Error("Export timed out");
}

async function generateSlide(token, slide) {
  const designId  = await copyTemplate(token, slide.heading);
  const sessionId = await startSession(token, designId);
  await replaceText(token, designId, sessionId, slide.heading, slide.body);
  await commitSession(token, designId, sessionId);
  const exportUrl = await exportDesign(token, designId);
  return { designId, exportUrl, heading: slide.heading };
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

  // 2. Generate Canva slides
  const slideExports = [];
  let canvaError = null;

  try {
    const token = await getCanvaToken(account_id);
    for (const slide of slideData.slides) {
      slideExports.push(await generateSlide(token, slide));
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
    campaign_id:   campaign.id,
    post_ids:      posts?.map((p) => p.id) ?? [],
    slides:        slideData.slides,
    caption:       slideData.caption,
    channel,
    canva_exports: slideExports,
    canva_error:   canvaError,
  });
}

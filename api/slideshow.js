import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Template design ID and known element IDs (inspected via Canva MCP)
const TEMPLATE_ID = "DAHNyb2h8Qo";
const ELEMENT_IDS = {
  heading: "PBTqQKYZMcllf3J7-LB0NVQyKCZNTSSb6",
  body:    "PBTqQKYZMcllf3J7-LBGrDT7XqkgdPsmN",
  cta:     "PBTqQKYZMcllf3J7-LBSy5DjklZmtTF7S",
};

const channelGuide = {
  instagram: "Instagram carousel (4-6 slides). Bold headlines, short punchy body. Visual-first. Use emojis sparingly. End with a strong CTA.",
  tiktok:    "TikTok slideshow (4-5 slides). Hook-first — the first slide must stop the scroll. Fast, energetic copy. Trend-aware tone.",
  reddit:    "Reddit post carousel (4-5 slides). Informative, value-first tone. No hard sell. Lead with insight, end with community question.",
  x:         "X/Twitter thread-style slides (4-5 slides). Punchy. Each slide = one idea. Last slide is the CTA or hot take.",
};

// ── Auth ──────────────────────────────────────────────────────────────────────

async function getCanvaToken(userId) {
  const { data: conn } = await supabase
    .from("social_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "canva")
    .eq("status", "connected")
    .single();

  if (!conn) throw new Error("Canva not connected. Visit /api/canva-auth first.");

  const expiresAt = new Date(conn.token_expires_at).getTime();
  if (Date.now() < expiresAt - 60_000) return conn.access_token;

  const creds = Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString("base64");
  const resp = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${creds}` },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: conn.refresh_token }),
  });
  if (!resp.ok) throw new Error(`Token refresh failed: ${await resp.text()}`);
  const { access_token, refresh_token, expires_in } = await resp.json();
  await supabase.from("social_connections")
    .update({ access_token, refresh_token, token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString() })
    .eq("user_id", userId).eq("provider", "canva");
  return access_token;
}

// ── Canva REST helpers ────────────────────────────────────────────────────────

function canvaHeaders(token) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// Copy the base template to get a fresh design for this slide
async function copyTemplate(token, title) {
  const resp = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: canvaHeaders(token),
    body: JSON.stringify({ asset_id: TEMPLATE_ID, title: title.slice(0, 50) }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Copy template failed (${resp.status}): ${text}`);
  const data = JSON.parse(text);
  console.log("copyTemplate response:", JSON.stringify(data));
  return data.design?.id ?? data.id;
}

// Start an editing session on a design
async function startSession(token, designId) {
  const resp = await fetch(`https://api.canva.com/rest/v1/designs/${designId}/editing-sessions`, {
    method: "POST",
    headers: canvaHeaders(token),
    body: JSON.stringify({}),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Start session failed (${resp.status}): ${text}`);
  const data = JSON.parse(text);
  console.log("startSession response:", JSON.stringify(data));
  return data.editing_session?.id ?? data.session_id ?? data.id;
}

// Replace text elements in an editing session
async function replaceText(token, designId, sessionId, heading, body) {
  const resp = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}/editing-sessions/${sessionId}/operations`,
    {
      method: "POST",
      headers: canvaHeaders(token),
      body: JSON.stringify({
        operations: [
          { type: "replace_text", element_id: ELEMENT_IDS.heading, text: heading },
          { type: "replace_text", element_id: ELEMENT_IDS.body,    text: body },
        ],
      }),
    }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Replace text failed (${resp.status}): ${text}`);
  console.log("replaceText response:", text.slice(0, 300));
}

// Commit the editing session
async function commitSession(token, designId, sessionId) {
  const resp = await fetch(
    `https://api.canva.com/rest/v1/designs/${designId}/editing-sessions/${sessionId}/commits`,
    { method: "POST", headers: canvaHeaders(token), body: JSON.stringify({}) }
  );
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Commit failed (${resp.status}): ${text}`);
  console.log("commitSession response:", text.slice(0, 200));
}

// Export a design to PNG and return the download URL
async function exportDesign(token, designId) {
  const resp = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: canvaHeaders(token),
    body: JSON.stringify({ design_id: designId, format: { type: "png", export_quality: "regular" } }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Export create failed (${resp.status}): ${text}`);
  const { job } = JSON.parse(text);

  // Poll until done
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api.canva.com/rest/v1/exports/${job.id}`, {
      headers: canvaHeaders(token),
    });
    const { job: j } = await poll.json();
    if (j.status === "success") return j.urls?.[0] ?? null;
    if (j.status === "failed") throw new Error("Export job failed");
  }
  throw new Error("Export timed out");
}

// Generate one slide PNG: copy template → edit text → commit → export
async function generateSlide(token, slide) {
  const designId = await copyTemplate(token, slide.heading);
  const sessionId = await startSession(token, designId);
  await replaceText(token, designId, sessionId, slide.heading, slide.body);
  await commitSession(token, designId, sessionId);
  const exportUrl = await exportDesign(token, designId);
  return { designId, exportUrl, heading: slide.heading };
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { project_id, user_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });
  if (!user_id)    return res.status(400).json({ error: "user_id required" });

  const { data: project } = await supabase.from("projects").select("*").eq("id", project_id).single();
  if (!project)              return res.status(404).json({ error: "Project not found" });
  if (!project.best_channel) return res.status(400).json({ error: "Run /api/analyze first" });

  // 1. Claude generates slide copy
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [{
      name: "create_slideshow",
      description: "Create a social media slideshow for the product",
      input_schema: {
        type: "object",
        properties: {
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                heading: { type: "string", description: "Short bold headline (max 8 words)" },
                body:    { type: "string", description: "Supporting copy (max 30 words)" },
              },
              required: ["heading", "body"],
              additionalProperties: false,
            },
            minItems: 4,
            maxItems: 6,
          },
          caption: { type: "string", description: "Post caption with hashtags (max 150 chars)" },
        },
        required: ["slides", "caption"],
        additionalProperties: false,
      },
    }],
    tool_choice: { type: "tool", name: "create_slideshow" },
    messages: [{
      role: "user",
      content: `Create a ${project.best_channel} slideshow for this ${project.industry} product.\n\nFormat guide: ${channelGuide[project.best_channel]}\n\nProduct brief:\n${project.doc_text.slice(0, 6000)}`,
    }],
  });

  const slideData = message.content.find((b) => b.type === "tool_use")?.input;
  if (!slideData) return res.status(500).json({ error: "Claude returned no tool call" });

  // 2. Generate Canva slides
  const slideExports = [];
  let canvaError = null;

  try {
    const token = await getCanvaToken(user_id);
    for (const slide of slideData.slides) {
      const result = await generateSlide(token, slide);
      slideExports.push(result);
    }
  } catch (err) {
    console.error("Canva error:", err.message);
    canvaError = err.message;
  }

  // 3. Persist to Supabase
  const { data: post } = await supabase.from("posts").insert({
    project_id,
    slides: slideData.slides,
    caption: slideData.caption,
    canva_design_id:  slideExports[0]?.designId ?? null,
    canva_export_url: slideExports[0]?.exportUrl ?? null,
    status: "draft",
  }).select().single();

  res.json({
    post_id:       post.id,
    slides:        slideData.slides,
    caption:       slideData.caption,
    channel:       project.best_channel,
    canva_exports: slideExports,
    canva_error:   canvaError,
  });
}

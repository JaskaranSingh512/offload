import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const channelGuide = {
  instagram: "Instagram carousel (4-6 slides). Bold headlines, short punchy body. Visual-first. Use emojis sparingly. End with a strong CTA.",
  tiktok: "TikTok slideshow (4-5 slides). Hook-first — the first slide must stop the scroll. Fast, energetic copy. Trend-aware tone.",
  reddit: "Reddit post carousel (4-5 slides). Informative, value-first tone. No hard sell. Lead with insight, end with community question.",
  x: "X/Twitter thread-style slides (4-5 slides). Punchy. Each slide = one idea. Last slide is the CTA or hot take.",
};

// Canva Connect REST API — uses client_credentials OAuth flow
// Docs: https://www.canva.com/developers/docs/connect/
async function getCanvaToken() {
  const resp = await fetch("https://api.canva.com/rest/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.CANVA_CLIENT_ID,
      client_secret: process.env.CANVA_CLIENT_SECRET,
      scope: "design:content:write asset:read",
    }),
  });
  if (!resp.ok) throw new Error(`Canva auth failed: ${await resp.text()}`);
  const { access_token } = await resp.json();
  return access_token;
}

async function createCanvaDesign(token, slide, channel) {
  // Create a blank instagram_post (1080x1350) or use a preset
  const resp = await fetch("https://api.canva.com/rest/v1/designs", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_type: { type: "preset", name: "InstagramPost" },
      title: slide.heading.slice(0, 50),
    }),
  });
  if (!resp.ok) throw new Error(`Canva design create failed: ${await resp.text()}`);
  const { design } = await resp.json();
  return design.id;
}

async function exportCanvaDesign(token, designId) {
  // Create export job
  const resp = await fetch(`https://api.canva.com/rest/v1/exports`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "png", export_quality: "regular" },
    }),
  });
  if (!resp.ok) throw new Error(`Canva export failed: ${await resp.text()}`);
  const { job } = await resp.json();

  // Poll until done (Canva exports are async)
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 1500));
    const poll = await fetch(`https://api.canva.com/rest/v1/exports/${job.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { job: j } = await poll.json();
    if (j.status === "success") return j.urls?.[0] ?? null;
    if (j.status === "failed") throw new Error("Canva export job failed");
  }
  throw new Error("Canva export timed out");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { project_id } = req.body;
  if (!project_id) return res.status(400).json({ error: "project_id required" });

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", project_id)
    .single();

  if (!project) return res.status(404).json({ error: "Project not found" });
  if (!project.best_channel) return res.status(400).json({ error: "Run /api/analyze first" });

  // 1. Claude generates slide copy
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    tools: [
      {
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
                  body: { type: "string", description: "Supporting copy (max 30 words)" },
                },
                required: ["heading", "body"],
                additionalProperties: false,
              },
              minItems: 4,
              maxItems: 6,
            },
            caption: {
              type: "string",
              description: "Post caption with hashtags (max 150 chars)",
            },
          },
          required: ["slides", "caption"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "create_slideshow" },
    messages: [
      {
        role: "user",
        content: `Create a ${project.best_channel} slideshow for this ${project.industry} product.\n\nFormat guide: ${channelGuide[project.best_channel]}\n\nProduct brief:\n${project.doc_text.slice(0, 6000)}`,
      },
    ],
  });

  const slideData = message.content.find((b) => b.type === "tool_use")?.input;
  if (!slideData) return res.status(500).json({ error: "Claude returned no tool call" });

  // 2. Canva: create one design per slide, export each as PNG
  let canvaDesignId = null;
  let canvaExportUrl = null;
  const slideExports = [];

  const canvaEnabled = !!(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);

  if (canvaEnabled) {
    try {
      const token = await getCanvaToken();
      for (const slide of slideData.slides) {
        const designId = await createCanvaDesign(token, slide, project.best_channel);
        const exportUrl = await exportCanvaDesign(token, designId);
        slideExports.push({ designId, exportUrl, heading: slide.heading });
      }
      canvaDesignId = slideExports[0]?.designId ?? null;
      canvaExportUrl = slideExports[0]?.exportUrl ?? null;
    } catch (err) {
      console.error("Canva error (non-fatal):", err.message);
      // Fall through — return slide copy without Canva export
    }
  }

  // 3. Persist to Supabase
  const { data: post } = await supabase
    .from("posts")
    .insert({
      project_id,
      slides: slideData.slides,
      caption: slideData.caption,
      canva_design_id: canvaDesignId,
      canva_export_url: canvaExportUrl,
      status: "draft",
    })
    .select()
    .single();

  res.json({
    post_id: post.id,
    slides: slideData.slides,
    caption: slideData.caption,
    channel: project.best_channel,
    canva_exports: slideExports,   // array of { designId, exportUrl, heading } per slide
    canva_enabled: canvaEnabled,
  });
}

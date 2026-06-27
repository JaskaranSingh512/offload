import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

  const channelGuide = {
    instagram: "Instagram carousel (4-6 slides). Bold headlines, short punchy body. Visual-first. Use emojis sparingly. End with a strong CTA.",
    tiktok: "TikTok slideshow (4-5 slides). Hook-first — the first slide must stop the scroll. Fast, energetic copy. Trend-aware tone.",
    reddit: "Reddit post carousel (4-5 slides). Informative, value-first tone. No hard sell. Lead with insight, end with community question.",
    x: "X/Twitter thread-style slides (4-5 slides). Punchy. Each slide = one idea. Last slide is the CTA or hot take.",
  };

  // Generate slide copy
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

  // TODO: Call Canva API here to generate the actual design
  // For now, save the slide copy and return it
  // canva_design_id and canva_export_url will be filled in once Canva is wired
  const { data: post } = await supabase
    .from("posts")
    .insert({
      project_id,
      slides: slideData.slides,
      caption: slideData.caption,
      status: "draft",
    })
    .select()
    .single();

  res.json({
    post_id: post.id,
    slides: slideData.slides,
    caption: slideData.caption,
    channel: project.best_channel,
    // canva_export_url: null  <- will be set after Canva integration
  });
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase  = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

const CHANNEL_GUIDE = {
  instagram: "Instagram carousel (4-6 slides). Bold headlines, short punchy body. Visual-first. End with a strong CTA.",
  tiktok:    "TikTok slideshow (4-5 slides). Hook-first — first slide must stop the scroll. Fast, energetic copy.",
  reddit:    "Reddit carousel (4-5 slides). Informative, value-first. No hard sell. End with a community question.",
  x:         "X/Twitter thread slides (4-5 slides). Punchy. One idea per slide. Last slide is the CTA or hot take.",
};

const FORMAT_MAP = {
  instagram: "ig_carousel",
  tiktok:    "tiktok_script",
  reddit:    "reddit_text",
  x:         "x_post",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { account_id } = req.body;
  if (!account_id) return res.status(400).json({ error: "account_id required" });

  const { data: brand } = await supabase
    .from("brands").select("*").eq("account_id", account_id).single();

  if (!brand)                           return res.status(404).json({ error: "Brand not found. Run /api/analyze first." });
  if (!brand.recommended_channels?.length) return res.status(400).json({ error: "No channel set. Run /api/analyze first." });

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

  // 2. Build slide image URLs (rendered by /api/slide-image via next/og — no external API needed)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://offload-sable.vercel.app";
  const total   = slideData.slides.length;
  const slideImages = slideData.slides.map((slide, i) => ({
    heading:   slide.heading,
    body:      slide.body,
    image_url: `${baseUrl}/api/slide-image?${new URLSearchParams({
      heading: slide.heading,
      body:    slide.body,
      slide:   String(i + 1),
      total:   String(total),
    }).toString()}`,
  }));

  // 3. Create campaign
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

  // 4. Insert posts — one per slide, content includes image_url
  const postRows = slideImages.map((slide, i) => ({
    account_id,
    campaign_id:    campaign.id,
    channel,
    format:         FORMAT_MAP[channel] ?? "ig_carousel",
    status:         "scheduled",
    approval_state: "pending",
    rationale:      `Slide ${i + 1}: AI-generated for ${brand.industry} on ${channel}`,
    content: {
      heading:   slide.heading,
      body:      slide.body,
      caption:   slideData.caption,
      image_url: slide.image_url,
    },
  }));

  const { data: posts } = await supabase.from("posts").insert(postRows).select("id");

  res.json({
    account_id,
    campaign_id: campaign.id,
    post_ids:    posts?.map((p) => p.id) ?? [],
    slides:      slideImages,
    caption:     slideData.caption,
    channel,
  });
}

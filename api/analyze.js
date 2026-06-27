import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { account_id, doc_text, doc_name } = req.body;
  if (!account_id) return res.status(400).json({ error: "account_id required" });
  if (!doc_text)   return res.status(400).json({ error: "doc_text required" });

  // Ensure account row exists
  await supabase.from("accounts").upsert({ id: account_id }, { onConflict: "id" });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [{
      name: "platform_recommendation",
      description: "Return the best social media platform for this product",
      input_schema: {
        type: "object",
        properties: {
          industry:          { type: "string" },
          best_channel:      { type: "string", enum: ["instagram", "tiktok", "reddit", "x"] },
          channel_rationale: { type: "string", description: "2-3 sentences on why this platform" },
        },
        required: ["industry", "best_channel", "channel_rationale"],
        additionalProperties: false,
      },
    }],
    tool_choice: { type: "tool", name: "platform_recommendation" },
    messages: [{
      role: "user",
      content: `You are a marketing strategist. Read this product brief and identify the industry and the single best social platform (Instagram, TikTok, Reddit, or X) for organic marketing.\n\n---\n${doc_text.slice(0, 8000)}\n---`,
    }],
  });

  const result = message.content.find((b) => b.type === "tool_use")?.input;
  if (!result) return res.status(500).json({ error: "Claude returned no tool call" });

  // Upsert brand row (account_id is PK)
  const { error: brandError } = await supabase.from("brands").upsert({
    account_id,
    doc_name:              doc_name ?? "Untitled",
    doc_text,
    industry:              result.industry,
    recommended_channels:  [result.best_channel],
    channel_rationale:     result.channel_rationale,
  }, { onConflict: "account_id" });

  if (brandError) {
    console.error("Brand upsert error:", brandError);
    return res.status(500).json({ error: brandError.message });
  }

  res.json({
    account_id,
    industry:          result.industry,
    best_channel:      result.best_channel,
    channel_rationale: result.channel_rationale,
  });
}

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { project_id, doc_text, doc_name, user_id } = req.body;
  if (!doc_text) return res.status(400).json({ error: "doc_text required" });

  // Save or update the project row
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .upsert({
      id: project_id || undefined,
      user_id,
      doc_name: doc_name || "Untitled",
      doc_text,
    })
    .select()
    .single();

  if (projectError) return res.status(500).json({ error: projectError.message });

  // Ask Claude which platform fits this doc
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    tools: [
      {
        name: "platform_recommendation",
        description: "Return the best social media platform for this product",
        input_schema: {
          type: "object",
          properties: {
            industry: { type: "string", description: "e.g. 'consumer food & beverage', 'B2B SaaS'" },
            best_channel: {
              type: "string",
              enum: ["instagram", "tiktok", "reddit", "x"],
              description: "The single best platform for this product",
            },
            channel_reason: {
              type: "string",
              description: "2-3 sentence explanation of why this platform will yield the most results",
            },
          },
          required: ["industry", "best_channel", "channel_reason"],
          additionalProperties: false,
        },
      },
    ],
    tool_choice: { type: "tool", name: "platform_recommendation" },
    messages: [
      {
        role: "user",
        content: `You are a marketing strategist. Read this product brief and identify the industry and the single social media platform (Instagram, TikTok, Reddit, or X/Twitter) that would yield the best organic marketing results for this specific product and audience.\n\n---\n${doc_text.slice(0, 8000)}\n---`,
      },
    ],
  });

  const result = message.content.find((b) => b.type === "tool_use")?.input;
  if (!result) return res.status(500).json({ error: "Claude returned no tool call" });

  // Persist analysis back to the project
  await supabase
    .from("projects")
    .update({
      industry: result.industry,
      best_channel: result.best_channel,
      channel_reason: result.channel_reason,
    })
    .eq("id", project.id);

  res.json({ project_id: project.id, ...result });
}

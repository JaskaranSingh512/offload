import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 30;

// The 4 publish channels (CONTRACT constraint). Canva is an asset integration, not a channel.
const CHANNELS = ["reddit", "tiktok", "instagram", "x"] as const;

// Strict tool → guaranteed-shape structured output (claude-api skill: strict on the tool,
// additionalProperties:false + required, forced tool_choice).
// `strict: true` guarantees the tool input validates exactly (claude-api skill). It's a real
// API field but isn't in this SDK version's Tool type, so we cast.
const STRATEGY_TOOL = {
  name: "channel_strategy",
  description:
    "Return the industry, the lead channel(s) to recommend, and a one-paragraph rationale for a founder's brand.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      industry: { type: "string", description: "Short industry label, e.g. 'specialty coffee / DTC'." },
      recommended_channels: {
        type: "array",
        description: "1-4 channels to lead with, most important first.",
        items: { type: "string", enum: [...CHANNELS] },
      },
      channel_rationale: {
        type: "string",
        description: "One paragraph explaining why those channels fit this brand and audience.",
      },
    },
    required: ["industry", "recommended_channels", "channel_rationale"],
  },
} as unknown as Anthropic.Tool;

type Strategy = {
  industry: string;
  recommended_channels: (typeof CHANNELS)[number][];
  channel_rationale: string;
};

export async function POST(req: Request) {
  let body: { doc_text?: string; doc_name?: string; name?: string; audience?: string; goal?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const docText = (body.doc_text ?? "").trim();
  if (!docText) {
    return Response.json({ error: "doc_text is required" }, { status: 400 });
  }

  // Resolve the signed-in account server-side (never trust an account id from the client).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let strategy: Strategy;
  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      tools: [STRATEGY_TOOL],
      tool_choice: { type: "tool", name: "channel_strategy" },
      messages: [
        {
          role: "user",
          content:
            `Brand name: ${body.name ?? "(unknown)"}\n` +
            `Goal: ${body.goal ?? "(unspecified)"}\n` +
            `Audience: ${body.audience ?? "(unspecified)"}\n\n` +
            `Brand document:\n${docText.slice(0, 12000)}\n\n` +
            `Decide the industry and which of Reddit, TikTok, Instagram, and X this founder should lead with ` +
            `(visual/consumer brands lean Instagram + TikTok; B2B/professional lean X + Reddit). ` +
            `Call the channel_strategy tool.`,
        },
      ],
    });
    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("Model did not return the channel_strategy tool call");
    }
    strategy = toolUse.input as Strategy;
  } catch (err) {
    console.error("[/api/analyze] generation failed", err);
    return Response.json({ error: "Analysis failed" }, { status: 502 });
  }

  // Persist onto the signed-in account's brand row (admin client bypasses RLS for the
  // server write; account_id is the session uid, never client-supplied).
  const admin = createAdminClient();
  const { error } = await admin.from("brands").upsert(
    {
      account_id: user.id,
      name: body.name ?? null,
      doc_name: body.doc_name ?? null,
      doc_text: docText,
      industry: strategy.industry,
      recommended_channels: strategy.recommended_channels,
      channel_rationale: strategy.channel_rationale,
    },
    { onConflict: "account_id" },
  );
  if (error) {
    console.error("[/api/analyze] brand upsert failed", error);
    return Response.json({ error: "Could not save analysis" }, { status: 500 });
  }

  return Response.json(strategy);
}

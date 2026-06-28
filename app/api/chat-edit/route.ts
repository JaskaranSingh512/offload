import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { validateAndMergePatch, validateFullContent } from "@/lib/ai/content-validation";
import type { ChatEditResponse, PostContent, PostFormat } from "@/lib/types/content";

export const runtime = "nodejs";
export const maxDuration = 30;

// Video copy is edited on the Scripts surface, not here (founder-posted).
const VIDEO = new Set<PostFormat>(["tiktok_script", "founder_script"]);

// Non-strict tool: the model returns ONLY the changed content fields (a partial patch), which a
// strict all-required schema can't express. Forced tool_choice still guarantees a tool call.
const EDIT_TOOL: Anthropic.Tool = {
  name: "apply_edit",
  description: "Return ONLY the content fields that should change for this post. Omit unchanged fields.",
  input_schema: {
    type: "object",
    additionalProperties: true,
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      tweets: { type: "array", items: { type: "string" } },
      slides: {
        type: "array",
        items: { type: "object", properties: { heading: { type: "string" }, sub: { type: "string" } } },
      },
      caption: { type: "string" },
      image_prompt: { type: "string" },
      hook: { type: "string" },
      scenes: { type: "array", items: { type: "string" } },
      shot_note: { type: "string" },
      duration_sec: { type: "integer" },
    },
  },
};

function summarize(format: PostFormat, message: string): string {
  const trimmed = message.length > 60 ? `${message.slice(0, 57)}…` : message;
  return `Updated the ${format.replace("_", " ")} copy — "${trimmed}"`;
}

export async function POST(req: Request) {
  let body: { postId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const postId = (body.postId ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!postId || !message) return Response.json({ error: "postId and message required" }, { status: 400 });

  // Auth + RLS-scoped read (the user can read their own rows + the showcase).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  // Scope to the owner: chat-edit only edits the user's OWN posts. A showcase/demo post (readable
  // under RLS) returns 404 here, so we don't spend a model call on something Apply can't persist.
  const { data: row, error } = await supabase
    .from("posts")
    .select("id, format, content")
    .eq("id", postId)
    .eq("account_id", user.id)
    .maybeSingle();
  if (error) return Response.json({ error: "Lookup failed" }, { status: 500 });
  if (!row) return Response.json({ error: "Post not found" }, { status: 404 });

  const format = row.format as PostFormat;
  if (VIDEO.has(format)) {
    return Response.json({ error: "Video copy is edited on its script row, not here." }, { status: 422 });
  }
  const current = (row.content ?? {}) as PostContent;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let rawPatch: unknown;
  try {
    const msg = await anthropic.messages.create(
      {
        model: "claude-haiku-4-5",
        max_tokens: 1500,
        tools: [EDIT_TOOL],
        tool_choice: { type: "tool", name: "apply_edit" },
        messages: [
          {
            role: "user",
            content:
              `You are editing ONE ${format} post.\n` +
              `Current content: ${JSON.stringify(current)}\n` +
              `Instruction: ${message}\n` +
              `Return only the changed fields via apply_edit. Keep X posts <=280 chars. Preserve the brand's warm, witty voice.`,
          },
        ],
      },
      // Bound the call well under maxDuration=30 so a hung request fails fast with JSON, not a 504.
      { signal: AbortSignal.timeout(20_000) },
    );
    const tu = msg.content.find((b) => b.type === "tool_use");
    if (!tu || tu.type !== "tool_use") throw new Error("no tool_use");
    rawPatch = tu.input;
  } catch (e) {
    console.error("[/api/chat-edit] generation failed:", e);
    return Response.json({ error: "Edit failed" }, { status: 502 });
  }

  // Merge-then-validate; fall back to treating the model output as a full content replacement.
  let result = validateAndMergePatch(format, current, rawPatch);
  if (!result.ok) result = validateFullContent(format, rawPatch);
  if (!result.ok) return Response.json({ error: result.error }, { status: 422 });

  const payload: ChatEditResponse = { postId, format, proposed_content: result.content, summary: summarize(format, message) };
  return Response.json(payload);
}

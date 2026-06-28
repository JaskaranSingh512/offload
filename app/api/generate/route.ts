import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { reanchorGolden, CACHED_RESEARCH, type GoldenPost } from "@/lib/golden-payload";
import { EMIT_POSTS_TOOL, validateAndCap } from "@/lib/generate-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAY_MS = 86_400_000;

type BrandRow = { name: string | null; goal: string | null; voice: string | null; one_liner: string | null; audience: string | null };

function buildPrompt(brand: BrandRow | null, channels: string[]): string {
  return [
    `You are Offload, a marketing autopilot. Write a 2-week launch campaign for this brand.`,
    `Brand: ${brand?.name ?? "the brand"}${brand?.one_liner ? ` — ${brand.one_liner}` : ""}`,
    `Voice: ${brand?.voice ?? "warm_witty"}. Goal: ${brand?.goal ?? "awareness"}.`,
    brand?.audience ? `Audience: ${brand.audience}` : "",
    ``,
    `Research dossier:\n${CACHED_RESEARCH}`,
    ``,
    `Emit EXACTLY 8 posts via the emit_posts tool, spread across these channels: ${channels.join(", ")}.`,
    `Include exactly one tiktok_script and one founder_script (both founder-posted video — fill the content hook/scenes/shot_note/duration_sec).`,
    `The other 6 are non-video (reddit_text, x_post, x_thread, ig_carousel, ig_single) across the channels.`,
    `Spread day 0-13 with channel-appropriate times. Keep X posts <=280 chars. Match the brand voice.`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function streamFromModel(
  prompt: string,
  send: (event: string, data: unknown) => void,
): Promise<unknown[]> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 28_000);
  try {
    const ms = anthropic.messages.stream(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 16_000,
        tools: [EMIT_POSTS_TOOL],
        tool_choice: { type: "tool", name: "emit_posts" },
        messages: [{ role: "user", content: prompt }],
      },
      { signal: ac.signal },
    );
    let ticks = 0;
    ms.on("streamEvent", (ev) => {
      if (ev.type === "content_block_delta") send("token", { tick: ++ticks });
    });
    const final = await ms.finalMessage();
    // Truncated output (hit max_tokens) yields a partial posts array with no throw — force the
    // golden fallback rather than insert a short campaign.
    if (final.stop_reason === "max_tokens") throw new Error("model output truncated");
    const tu = final.content.find((b) => b.type === "tool_use");
    if (!tu || tu.type !== "tool_use") throw new Error("no tool_use in response");
    const posts = (tu.input as { posts?: unknown }).posts;
    if (!Array.isArray(posts) || posts.length === 0) throw new Error("empty posts");
    return posts;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  let brief: { channels?: string[] } = {};
  try {
    brief = await req.json();
  } catch {
    /* empty body is fine */
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const channels = brief.channels?.length ? brief.channels : ["reddit", "tiktok", "instagram", "x"];

  // Brand for the prompt.
  const { data: brand } = await admin
    .from("brands")
    .select("name, goal, voice, one_liner, audience")
    .eq("account_id", user.id)
    .maybeSingle();

  // Ensure exactly one campaign for this account (reuse on regen).
  let campaignId: string;
  let campaignStart: string;
  const { data: existing } = await admin
    .from("campaigns")
    .select("id, starts_on")
    .eq("account_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) {
    campaignId = existing.id;
    campaignStart = existing.starts_on ? new Date(existing.starts_on).toISOString() : new Date().toISOString();
  } else {
    const start = new Date();
    const startIso = start.toISOString().slice(0, 10);
    const endIso = new Date(start.getTime() + 13 * DAY_MS).toISOString().slice(0, 10);
    const { data: created, error: campErr } = await admin
      .from("campaigns")
      .insert({
        account_id: user.id,
        name: brand?.name ? `${brand.name} — Launch` : "Launch campaign",
        goal: (brand?.goal ?? "awareness") as never,
        duration_days: 14,
        frequency: "balanced" as never,
        channels,
        status: "active" as never,
        starts_on: startIso,
        ends_on: endIso,
      })
      .select("id")
      .single();
    if (campErr || !created) return Response.json({ error: "Could not create campaign" }, { status: 500 });
    campaignId = created.id;
    campaignStart = start.toISOString();
  }

  const forceFail = req.headers.get("x-force-fail") === "1";
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      let usedGolden = false;
      let clean: GoldenPost[] = [];
      try {
        if (forceFail) throw new Error("x-force-fail");
        const rawPosts = await streamFromModel(buildPrompt(brand, channels), send);
        clean = rawPosts.map((p) => validateAndCap(p, campaignStart)).filter((p): p is GoldenPost => p !== null);
        // Too few valid posts (under-produced or partially-invalid) → fall back rather than ship a thin campaign.
        if (clean.length < 6) throw new Error("too few valid posts");
      } catch (err) {
        console.error("[/api/generate] golden fallback:", err);
        usedGolden = true;
        clean = reanchorGolden(campaignStart);
        clean.forEach((_, i) => send("token", { tick: i + 1, golden: true }));
      }

      try {
        // The RPC clears this account's prior non-published rows for the campaign AND inserts the
        // fresh batch in one transaction (so a failure never empties the campaign). The seed lives
        // on a different account, so it's never touched.
        const { error: rpcErr } = await admin.rpc("create_campaign_posts", {
          p_account: user.id,
          p_campaign: campaignId,
          p_posts: clean as unknown as never,
        });
        if (rpcErr) throw rpcErr;
        send("done", { ok: true, count: clean.length, golden: usedGolden });
      } catch (e) {
        console.error("[/api/generate] insert failed:", e);
        send("error", { message: "insert failed" });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

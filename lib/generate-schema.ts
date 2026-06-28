import Anthropic from "@anthropic-ai/sdk";
import type { ChannelId } from "@/lib/data";
import type { PostFormat } from "@/lib/types/content";
import { Constants } from "@/lib/database.types";
import { validateFullContent } from "@/lib/ai/content-validation";
import { resolveScheduledAt, type GoldenPost } from "@/lib/golden-payload";

const CHANNELS: readonly ChannelId[] = ["reddit", "tiktok", "instagram", "x"];

// Strict tool whose items ARE the posts row shape. JSON-schema can't express a per-format
// discriminated union, so `content` carries every field (the server picks the right ones per
// format in validateAndCap). Strict requires every key in `required` + additionalProperties:false
// at each level and forbids length constraints (we cap server-side). Cast: SDK 0.52 lacks `strict`.
export const EMIT_POSTS_TOOL = {
  name: "emit_posts",
  description:
    "Emit a 2-week launch campaign as ~8 posts across Reddit, TikTok, Instagram, and X. Use each channel's native formats. For video formats (tiktok_script, founder_script) fill the content hook/scenes/shot_note/duration_sec fields.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["posts"],
    properties: {
      posts: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["channel", "format", "day", "time", "rationale", "content"],
          properties: {
            channel: { type: "string", enum: ["reddit", "tiktok", "instagram", "x"] },
            format: { type: "string", enum: [...Constants.public.Enums.format_t] },
            day: { type: "integer", description: "0-13, the campaign day." },
            time: { type: "string", description: "HH:MM 24h posting time." },
            rationale: { type: "string", description: "One sentence on why this post/format/timing." },
            content: {
              type: "object",
              additionalProperties: false,
              required: [
                "title", "body", "tweets", "slides", "caption",
                "image_prompt", "hook", "scenes", "shot_note", "duration_sec",
              ],
              properties: {
                title: { type: "string", description: "reddit_text/x_post title (x_post: empty)." },
                body: { type: "string", description: "reddit_text/x_post body." },
                tweets: { type: "array", items: { type: "string" }, description: "x_thread tweets." },
                slides: {
                  type: "array",
                  description: "ig_carousel slides.",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["heading", "sub"],
                    properties: { heading: { type: "string" }, sub: { type: "string" } },
                  },
                },
                caption: { type: "string", description: "ig_carousel/ig_single caption." },
                image_prompt: { type: "string", description: "ig_single image prompt." },
                hook: { type: "string", description: "tiktok_script/founder_script hook." },
                scenes: { type: "array", items: { type: "string" }, description: "tiktok_script/founder_script beats." },
                shot_note: { type: "string", description: "video shot note." },
                duration_sec: { type: "integer", description: "video duration seconds (5-180)." },
              },
            },
          },
        },
      },
    },
  },
} as unknown as Anthropic.Tool;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function strArr(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

// Validate + cap a single post (a model item with day/time, OR a pre-baked golden item with
// scheduled_at). Returns a GoldenPost ready for the RPC, or null if malformed (caller drops it).
export function validateAndCap(raw: unknown, campaignStart: string): GoldenPost | null {
  if (!isRecord(raw)) return null;
  const channel = str(raw.channel);
  const format = str(raw.format);
  if (!channel || !CHANNELS.includes(channel as ChannelId)) return null;
  if (!format || !(Constants.public.Enums.format_t as readonly string[]).includes(format)) return null;
  const ch = channel as ChannelId;
  const fmt = format as PostFormat;
  const rationale = str(raw.rationale) ?? "";
  const rawContent = isRecord(raw.content) ? raw.content : {};

  // Resolve scheduling once: golden items carry scheduled_at; model items carry day/time.
  const schedInput =
    "scheduled_at" in raw ? (raw.scheduled_at as string | null) : { day: num(raw.day) ?? 0, time: str(raw.time) ?? "09:00" };

  if (fmt === "founder_script") {
    // posts.content stays {}; the script lives in the paired founder_scripts row. Script fields
    // come from top-level (golden) or content (model).
    const hook = str(raw.hook) ?? str(rawContent.hook) ?? "";
    if (!hook) return null;
    return {
      channel: ch, format: fmt, scheduled_at: null, content: {}, rationale, status: "draft", approval_state: "pending",
      angle: str(raw.angle) ?? "founder-voice",
      hook,
      beats: strArr(raw.beats) ?? strArr(rawContent.scenes) ?? [],
      shot_note: str(raw.shot_note) ?? str(rawContent.shot_note) ?? "",
      duration_sec: num(raw.duration_sec) ?? num(rawContent.duration_sec) ?? 45,
    };
  }

  if (fmt === "tiktok_script") {
    const v = validateFullContent(fmt, rawContent);
    if (!v.ok) return null;
    const c = v.content as { hook: string; scenes: string[]; shot_note: string; duration_sec: number };
    return {
      channel: ch, format: fmt, scheduled_at: null, content: c, rationale, status: "draft", approval_state: "pending",
      angle: str(raw.angle) ?? "product-demo",
      hook: c.hook, beats: c.scenes, shot_note: c.shot_note, duration_sec: c.duration_sec,
    };
  }

  // Non-video: validate content, schedule it.
  const v = validateFullContent(fmt, rawContent);
  if (!v.ok) return null;
  return {
    channel: ch, format: fmt, scheduled_at: resolveScheduledAt(schedInput, campaignStart),
    content: v.content, rationale, status: "scheduled", approval_state: "pending",
  };
}

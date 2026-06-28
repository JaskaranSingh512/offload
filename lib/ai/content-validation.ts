import type { PostContent, PostFormat } from "@/lib/types/content";

// Per-format limits enforced server-side after the model parses (JSON-schema length limits are
// not enforced by the API, so we cap here). Referenced by the tests.
export const CAPS = {
  reddit_title: 300,
  reddit_body: 40_000,
  x_text: 280,
  x_thread_max: 10,
  carousel_slides_max: 10,
  carousel_heading: 80,
  carousel_sub: 160,
  caption: 2_200,
  image_prompt: 1_000,
  tiktok_hook: 200,
  tiktok_scene: 200,
  tiktok_scenes_max: 12,
  tiktok_shot_note: 300,
  tiktok_dur_min: 5,
  tiktok_dur_max: 180,
} as const;

// ig_single.image_path must point at the account's generated bucket path — but Phase 5 has no
// image-gen, so an EMPTY image_path is valid; the regex only applies when it's non-empty.
export const IG_GENERATED_PATH = /^brand-assets\/[^/]+\/generated\/.+/;

export type ValidationResult = { ok: true; content: PostContent } | { ok: false; error: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function strArr(v: unknown): string[] | null {
  return Array.isArray(v) && v.every((x) => typeof x === "string") ? (v as string[]) : null;
}

// Validate a COMPLETE content object for a given format, returning the cleaned content (only the
// expected fields) or an error. This is the single source of truth used by both /api/generate
// (per-post) and /api/chat-edit (full + merged-patch paths).
export function validateFullContent(format: PostFormat, raw: unknown): ValidationResult {
  if (format === "founder_script") return { ok: true, content: {} };
  if (!isRecord(raw)) return { ok: false, error: "content must be an object" };

  switch (format) {
    case "reddit_text": {
      const title = str(raw.title) ?? "";
      const body = str(raw.body);
      if (body === null) return { ok: false, error: "reddit_text requires a string body" };
      if (title.length > CAPS.reddit_title) return { ok: false, error: "reddit_text title too long" };
      if (body.length === 0 || body.length > CAPS.reddit_body) return { ok: false, error: "reddit_text body length invalid" };
      return { ok: true, content: { title, body } };
    }
    case "x_post": {
      const title = str(raw.title) ?? "";
      const body = str(raw.body);
      if (body === null) return { ok: false, error: "x_post requires a string body" };
      if (title.length > CAPS.x_text) return { ok: false, error: "x_post title too long" };
      if (body.length === 0 || body.length > CAPS.x_text) return { ok: false, error: "x_post body over 280" };
      return { ok: true, content: { title, body } };
    }
    case "x_thread": {
      const tweets = strArr(raw.tweets);
      if (!tweets || tweets.length === 0) return { ok: false, error: "x_thread requires tweets[]" };
      if (tweets.length > CAPS.x_thread_max) return { ok: false, error: "x_thread over 10 tweets" };
      if (tweets.some((t) => t.length === 0 || t.length > CAPS.x_text)) return { ok: false, error: "x_thread tweet over 280" };
      return { ok: true, content: { tweets } };
    }
    case "ig_carousel": {
      const caption = str(raw.caption);
      if (caption === null || caption.length > CAPS.caption) return { ok: false, error: "ig_carousel caption invalid" };
      if (!Array.isArray(raw.slides) || raw.slides.length === 0) return { ok: false, error: "ig_carousel requires slides[]" };
      if (raw.slides.length > CAPS.carousel_slides_max) return { ok: false, error: "ig_carousel over 10 slides" };
      const slides: { heading: string; sub: string }[] = [];
      for (const s of raw.slides) {
        if (!isRecord(s)) return { ok: false, error: "ig_carousel slide must be an object" };
        const heading = str(s.heading) ?? "";
        const sub = str(s.sub) ?? "";
        if (heading.length > CAPS.carousel_heading) return { ok: false, error: "carousel heading too long" };
        if (sub.length > CAPS.carousel_sub) return { ok: false, error: "carousel sub too long" };
        slides.push({ heading, sub });
      }
      return { ok: true, content: { slides, caption } };
    }
    case "ig_single": {
      const caption = str(raw.caption);
      if (caption === null || caption.length > CAPS.caption) return { ok: false, error: "ig_single caption invalid" };
      const image_prompt = str(raw.image_prompt) ?? "";
      if (image_prompt.length > CAPS.image_prompt) return { ok: false, error: "ig_single image_prompt too long" };
      const image_path = str(raw.image_path) ?? "";
      if (image_path.length > 0 && !IG_GENERATED_PATH.test(image_path)) return { ok: false, error: "ig_single image_path invalid" };
      return { ok: true, content: { caption, image_prompt, image_path } };
    }
    case "tiktok_script": {
      const hook = str(raw.hook);
      if (hook === null || hook.length === 0 || hook.length > CAPS.tiktok_hook) return { ok: false, error: "tiktok_script hook invalid" };
      const scenes = strArr(raw.scenes);
      if (!scenes || scenes.length === 0) return { ok: false, error: "tiktok_script requires scenes[]" };
      if (scenes.length > CAPS.tiktok_scenes_max) return { ok: false, error: "tiktok_script too many scenes" };
      if (scenes.some((s) => s.length > CAPS.tiktok_scene)) return { ok: false, error: "tiktok_script scene too long" };
      const shot_note = str(raw.shot_note) ?? "";
      if (shot_note.length > CAPS.tiktok_shot_note) return { ok: false, error: "tiktok_script shot_note too long" };
      const dRaw = raw.duration_sec;
      const duration_sec = typeof dRaw === "number" && Number.isFinite(dRaw) ? Math.round(dRaw) : NaN;
      if (!Number.isFinite(duration_sec) || duration_sec < CAPS.tiktok_dur_min || duration_sec > CAPS.tiktok_dur_max)
        return { ok: false, error: "tiktok_script duration_sec out of range" };
      return { ok: true, content: { hook, scenes, shot_note, duration_sec } };
    }
  }
}

// Merge a partial patch over the current content, then validate the full result. Top-level merge
// (arrays are replaced wholesale) — sufficient for single-post chat-edit intent.
export function validateAndMergePatch(format: PostFormat, current: PostContent, patch: unknown): ValidationResult {
  if (!isRecord(patch)) return { ok: false, error: "patch must be an object" };
  const merged = { ...(current as Record<string, unknown>), ...patch };
  return validateFullContent(format, merged);
}

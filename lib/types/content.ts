import type { Database } from "@/lib/database.types";

// The post.format enum from the generated DB types — the single source of truth for
// which content shapes exist (CONTRACT §1b). PostContent below is keyed against it.
export type PostFormat = Database["public"]["Enums"]["format_t"];

// ===== The five posts.content JSONB shapes (CONTRACT §1b) =====
export type TextContent = { title: string; body: string }; // reddit_text | x_post
export type ThreadContent = { tweets: string[] }; // x_thread
export type CarouselContent = {
  slides: { heading: string; sub: string }[];
  caption: string;
}; // ig_carousel (text layer only)
export type SingleImageContent = {
  caption: string;
  image_prompt: string;
  image_path: string;
}; // ig_single
export type TikTokScriptContent = {
  hook: string;
  scenes: string[];
  shot_note: string;
  duration_sec: number;
}; // tiktok_script
// founder_script posts keep their content in the founder_scripts row — posts.content is {}.
export type FounderScriptContent = Record<string, never>;

export type PostContent =
  | TextContent
  | ThreadContent
  | CarouselContent
  | SingleImageContent
  | TikTokScriptContent
  | FounderScriptContent;

// Format → content shape, so the drawer and Phase-5 /api/chat-edit patch both type-check
// against these shapes (narrow by the post's `format`).
export interface PostContentByFormat {
  reddit_text: TextContent;
  x_post: TextContent;
  x_thread: ThreadContent;
  ig_carousel: CarouselContent;
  ig_single: SingleImageContent;
  tiktok_script: TikTokScriptContent;
  founder_script: FounderScriptContent;
}

// Runtime list of every format key — kept in lockstep with the format_t enum by the
// contract test (lib types are erased at runtime, so the test needs a real array).
export const POST_FORMATS = [
  "reddit_text",
  "x_post",
  "x_thread",
  "ig_carousel",
  "ig_single",
  "tiktok_script",
  "founder_script",
] as const satisfies readonly PostFormat[];

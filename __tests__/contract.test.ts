import { describe, it, expect } from "vitest";
import { Constants } from "@/lib/database.types";
import { POST_FORMATS, type PostContentByFormat } from "@/lib/types/content";

// Guard the mock→live seam: the PostContent discriminated union and the runtime POST_FORMATS
// list must stay in lockstep with the DB's format_t enum, so the adapter (lib/api.ts) and the
// drawer can't silently drift from the schema (CONTRACT §1b).
describe("PostContent ↔ format_t contract", () => {
  it("POST_FORMATS matches the DB format_t enum exactly", () => {
    expect([...POST_FORMATS].sort()).toEqual([...Constants.public.Enums.format_t].sort());
  });

  it("PostContentByFormat has a key for every format_t value", () => {
    // Compile-time: every enum value must index PostContentByFormat. Runtime: same set.
    const keys: Record<keyof PostContentByFormat, true> = {
      reddit_text: true,
      x_post: true,
      x_thread: true,
      ig_carousel: true,
      ig_single: true,
      tiktok_script: true,
      founder_script: true,
    };
    expect(Object.keys(keys).sort()).toEqual([...Constants.public.Enums.format_t].sort());
  });

  it("the two post-status enums match the contract", () => {
    expect(Constants.public.Enums.post_status_t).toEqual([
      "draft",
      "scheduled",
      "published",
      "needs_attention",
      "stalled",
    ]);
    expect(Constants.public.Enums.approval_t).toEqual(["pending", "approved", "rejected"]);
  });
});

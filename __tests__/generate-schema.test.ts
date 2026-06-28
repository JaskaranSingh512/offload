import { describe, it, expect } from "vitest";
import { validateAndCap } from "@/lib/generate-schema";
import { GOLDEN_PAYLOAD } from "@/lib/golden-payload";

const START = "2026-06-22T00:00:00Z";

describe("validateAndCap", () => {
  it("accepts a model-style non-video item and resolves its scheduled_at", () => {
    const out = validateAndCap(
      { channel: "reddit", format: "reddit_text", day: 1, time: "08:00", rationale: "r", content: { title: "T", body: "B" } },
      START,
    );
    expect(out).not.toBeNull();
    expect(out?.status).toBe("scheduled");
    expect(out?.approval_state).toBe("pending");
    expect(out?.scheduled_at).toBe("2026-06-23T08:00:00.000Z");
  });

  it("emits video posts at draft with null scheduled_at + script fields", () => {
    const tk = validateAndCap(
      { channel: "tiktok", format: "tiktok_script", day: 2, time: "18:00", rationale: "r", content: { hook: "h", scenes: ["a", "b"], shot_note: "n", duration_sec: 30 } },
      START,
    );
    expect(tk?.status).toBe("draft");
    expect(tk?.scheduled_at).toBeNull();
    expect(tk?.beats).toEqual(["a", "b"]);
    const fs = validateAndCap(
      { channel: "tiktok", format: "founder_script", rationale: "r", content: { hook: "founder hook", scenes: ["x"], shot_note: "n", duration_sec: 40 } },
      START,
    );
    expect(fs?.status).toBe("draft");
    expect(fs?.content).toEqual({}); // founder_script posts.content stays empty
    expect(fs?.hook).toBe("founder hook");
  });

  it("drops malformed posts (null)", () => {
    expect(validateAndCap({ channel: "x", format: "x_post", day: 0, time: "09:00", rationale: "", content: { title: "", body: "x".repeat(281) } }, START)).toBeNull();
    expect(validateAndCap({ channel: "mastodon", format: "reddit_text", content: {} }, START)).toBeNull(); // bad channel
    expect(validateAndCap({ channel: "reddit", format: "blog", content: {} }, START)).toBeNull(); // bad format
    expect(validateAndCap("nope", START)).toBeNull();
  });

  it("validates every golden-payload post", () => {
    for (const p of GOLDEN_PAYLOAD) {
      expect(validateAndCap(p, START), `golden ${p.format}`).not.toBeNull();
    }
  });
});

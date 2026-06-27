import { describe, it, expect } from "vitest";
import { posts, channelMeta, dateLabels } from "@/lib/data";

describe("campaign data contract", () => {
  it("ships exactly 35 posts across the 14-day campaign", () => {
    expect(posts.length).toBe(35);
  });

  it("only uses the four locked channels", () => {
    const allowed = new Set(["reddit", "tiktok", "instagram", "x"]);
    for (const p of posts) {
      expect(allowed.has(p.channel)).toBe(true);
    }
    expect(Object.keys(channelMeta).sort()).toEqual(["instagram", "reddit", "tiktok", "x"]);
  });

  it("maps every campaign day to a calendar label", () => {
    expect(dateLabels.length).toBe(14);
    for (const p of posts) {
      expect(dateLabels[p.day]).toBeDefined();
    }
  });
});

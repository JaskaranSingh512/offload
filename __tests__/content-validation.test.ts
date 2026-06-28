import { describe, it, expect } from "vitest";
import { validateFullContent, validateAndMergePatch, CAPS } from "@/lib/ai/content-validation";

describe("validateFullContent", () => {
  it("accepts a valid reddit_text and rejects an empty/oversized body", () => {
    expect(validateFullContent("reddit_text", { title: "Hi", body: "real body" }).ok).toBe(true);
    expect(validateFullContent("reddit_text", { title: "Hi", body: "" }).ok).toBe(false);
    expect(validateFullContent("reddit_text", { title: "x".repeat(CAPS.reddit_title + 1), body: "b" }).ok).toBe(false);
    expect(validateFullContent("reddit_text", { title: "Hi" }).ok).toBe(false); // missing body
  });

  it("caps x_post body at 280", () => {
    expect(validateFullContent("x_post", { title: "", body: "short" }).ok).toBe(true);
    expect(validateFullContent("x_post", { title: "", body: "x".repeat(281) }).ok).toBe(false);
  });

  it("enforces x_thread length + count", () => {
    expect(validateFullContent("x_thread", { tweets: ["a", "b"] }).ok).toBe(true);
    expect(validateFullContent("x_thread", { tweets: [] }).ok).toBe(false);
    expect(validateFullContent("x_thread", { tweets: Array(CAPS.x_thread_max + 1).fill("t") }).ok).toBe(false);
    expect(validateFullContent("x_thread", { tweets: ["x".repeat(281)] }).ok).toBe(false);
    expect(validateFullContent("x_thread", { tweets: [1, 2] }).ok).toBe(false); // not strings
  });

  it("validates ig_carousel slides + caps", () => {
    expect(validateFullContent("ig_carousel", { slides: [{ heading: "H", sub: "S" }], caption: "cap" }).ok).toBe(true);
    expect(validateFullContent("ig_carousel", { slides: [], caption: "cap" }).ok).toBe(false);
    expect(validateFullContent("ig_carousel", { slides: [{ heading: "x".repeat(CAPS.carousel_heading + 1), sub: "" }], caption: "c" }).ok).toBe(false);
    expect(validateFullContent("ig_carousel", { slides: [{ heading: "H", sub: "S" }] }).ok).toBe(false); // missing caption
  });

  it("accepts ig_single with EMPTY image_path but rejects a bad non-empty path", () => {
    expect(validateFullContent("ig_single", { caption: "c", image_prompt: "p", image_path: "" }).ok).toBe(true);
    expect(validateFullContent("ig_single", { caption: "c", image_prompt: "p", image_path: "not/a/valid/path" }).ok).toBe(false);
    const good = validateFullContent("ig_single", { caption: "c", image_prompt: "p", image_path: "brand-assets/abc/generated/x.png" });
    expect(good.ok).toBe(true);
  });

  it("bounds tiktok_script scenes + duration", () => {
    expect(validateFullContent("tiktok_script", { hook: "h", scenes: ["s1"], shot_note: "n", duration_sec: 30 }).ok).toBe(true);
    expect(validateFullContent("tiktok_script", { hook: "h", scenes: ["s"], shot_note: "", duration_sec: 1 }).ok).toBe(false); // too short
    expect(validateFullContent("tiktok_script", { hook: "h", scenes: ["s"], shot_note: "", duration_sec: 999 }).ok).toBe(false); // too long
    expect(validateFullContent("tiktok_script", { hook: "", scenes: ["s"], shot_note: "", duration_sec: 30 }).ok).toBe(false); // empty hook
  });

  it("treats founder_script content as empty/valid", () => {
    expect(validateFullContent("founder_script", {}).ok).toBe(true);
    expect(validateFullContent("founder_script", null).ok).toBe(true);
  });

  it("rejects a non-object content", () => {
    expect(validateFullContent("reddit_text", "nope").ok).toBe(false);
    expect(validateFullContent("ig_carousel", 42).ok).toBe(false);
  });
});

describe("validateAndMergePatch", () => {
  it("merges a partial patch over current content", () => {
    const res = validateAndMergePatch("reddit_text", { title: "Old", body: "old body" }, { body: "new warmer body" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.content).toEqual({ title: "Old", body: "new warmer body" });
  });

  it("rejects a non-object patch", () => {
    expect(validateAndMergePatch("reddit_text", { title: "", body: "b" }, "not an object").ok).toBe(false);
  });

  it("rejects a patch that pushes content past a cap", () => {
    expect(validateAndMergePatch("x_post", { title: "", body: "ok" }, { body: "x".repeat(281) }).ok).toBe(false);
  });
});

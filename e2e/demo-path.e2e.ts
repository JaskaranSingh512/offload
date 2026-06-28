import { test, expect } from "@playwright/test";

// ===== Phase 8 — MOCK 9-step demo walk (the 3×-pass gate) =====
// Runs against the local production server booted by playwright.config's webServer in
// MOCK mode (NEXT_PUBLIC_USE_MOCK=true) with E2E_BYPASS_AUTH=1 so the middleware lets us
// reach gated routes without an interactive OAuth login. Pure UI assertions — no DB.
//
// Mock-mode nuance (verified in lib/api.ts + lib/data.tsx): mock posts have no `dbId`, so
// the chat is never post-scoped and the single-post live patch can't run here — that true
// "wow moment" (drawer updates live from a real /api/chat-edit patch) is exercised by the
// LIVE spec (e2e/live-db.e2e.ts). In mock we exercise the equivalent §6.6 chat instruction
// layer: a schedule-level ask → "Proposed change" preview → Apply. Both prove the same UI.

test("9-step demo path renders and is interactive (mock)", async ({ page }) => {
  // ---- Step 1 · Onboarding wizard ----
  await test.step("1 · onboarding", async () => {
    await page.goto("/onboarding");

    // 00 Welcome
    await expect(page.getByText("Welcome to Offload")).toBeVisible();
    await page.getByRole("button", { name: "Get started" }).click();

    // 01 Brand (doc upload is optional — just advance)
    await expect(page.getByText("01 · Brand")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // 02 Audience & Goals
    await expect(page.getByText("02 · Audience & Goals")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // 03 Channels — the 4 channels render; defaults are fine, advance
    await expect(page.getByText("03 · Channels")).toBeVisible();
    for (const ch of ["Reddit", "TikTok", "Instagram", "X"]) {
      await expect(page.getByRole("heading", { name: ch, exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Continue" }).click();

    // 04 Connect accounts — connect one channel, confirm the optimistic "Connected" chip
    await expect(page.getByText("04 · Connect accounts")).toBeVisible();
    await page.getByRole("button", { name: "Connect" }).first().click();
    await expect(page.getByText("Connected", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Generate my first campaign" }).click();
  });

  // ---- Steps 2 & 3 · land on Dashboard (loader self-completes even if generate errors) ----
  await test.step("2-3 · dashboard", async () => {
    // "Next up" only renders on the dashboard, so its visibility proves we left onboarding.
    await expect(page.getByText("Next up")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("Signups trend · last 7 days")).toBeVisible();
  });

  // ---- Step 4 · Calendar ----
  await test.step("4 · calendar", async () => {
    await page.goto("/calendar");
    await expect(page.getByText("Week 1 · June 22 – June 28")).toBeVisible();
    await expect(page.locator(".cal-post").first()).toBeVisible();
    expect(await page.locator(".cal-post").count()).toBeGreaterThan(0);
  });

  // ---- Step 5 · Founder Scripts → Mark filmed ----
  await test.step("5 · scripts mark filmed", async () => {
    await page.goto("/scripts");
    const firstCard = page.locator("article.script-card").first();
    await expect(firstCard).toBeVisible();
    await firstCard.getByRole("button", { name: "Mark filmed" }).click();
    await expect(page.getByText(/marked filmed/i)).toBeVisible();
  });

  // ---- Step 6 · Chat-edit (the wow moment — §6.6 instruction layer in mock) ----
  await test.step("6 · chat instruction → preview → apply", async () => {
    await page.goto("/calendar");
    await page.getByRole("button", { name: "Ask Offload" }).click();
    const dialog = page.getByRole("dialog", { name: "Ask Offload" });
    await expect(dialog).toBeVisible();

    // A schedule-level ask yields a structured "Proposed change" card the user previews.
    await page.getByRole("button", { name: "Add 3 Reddit posts to week 2" }).click();
    const change = page.locator(".chat-change");
    await expect(change).toBeVisible();
    await expect(change.getByText("Proposed change")).toBeVisible();

    await change.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText("Change applied.")).toBeVisible();

    await page.keyboard.press("Escape"); // close the chat panel
    await expect(dialog).toBeHidden();
  });

  // ---- Step 6b/7 · open a Reddit post → Approve ----
  await test.step("7 · open post + approve", async () => {
    // p1 is a Reddit post; locate its tile by a stable fragment of its title.
    const redditTile = page.locator(".cal-post", { hasText: "reverse-engineering" }).first();
    await redditTile.click();

    const drawer = page.locator(".drawer");
    await expect(drawer).toBeVisible();
    // Reddit → text family → "Edit copy"; the Reddit preview shows the post title.
    await expect(drawer.getByRole("button", { name: "Edit copy" })).toBeVisible();
    await expect(drawer.getByText("reverse-engineering").first()).toBeVisible();

    await drawer.getByRole("button", { name: "Approve" }).click();
    await expect(page.getByText("Post approved", { exact: false })).toBeVisible();
    await expect(drawer).toBeHidden(); // drawer closes on approve
  });

  // ---- Step 8 · Analytics Recap (default) + toggle round-trip ----
  await test.step("8 · analytics recap", async () => {
    await page.goto("/analytics");
    await expect(page.getByText("+34% vs forecast")).toBeVisible(); // recap is the default mode

    await page.getByRole("button", { name: "In-flight" }).click();
    await expect(page.getByText("Impressions (so far)")).toBeVisible();

    await page.getByRole("button", { name: "Recap" }).click();
    await expect(page.getByText("+34% vs forecast")).toBeVisible();
  });

  // ---- Step 9 · Brief next → Campaign Builder ----
  await test.step("9 · brief next → builder", async () => {
    await page.getByRole("button", { name: "Brief next campaign" }).first().click();
    await page.waitForURL("**/build");
    await expect(page.getByText("new campaign.")).toBeVisible();
  });
});

import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects:
 *  - `mock` (default): runs against the LOCAL production server booted in MOCK
 *    mode by the global `webServer` below. UI-only, deterministic, zero live env.
 *  - `live`: real Supabase. Inert unless E2E_LIVE=1 (the spec top-level-skips on
 *    that). storageState is scoped to the live project, and globalSetup is gated
 *    on E2E_LIVE so it is `undefined` for the mock run — meaning live creds /
 *    `e2e/.auth/state.json` are *only* touched when the live project runs.
 *
 * NOTE: Playwright (1.61) has no per-project `globalSetup` field — only the
 * top-level config and the project `use.storageState` / `dependencies` exist.
 * Gating the top-level `globalSetup` on E2E_LIVE is how we keep it from running
 * (and requiring live env) during the default mock run.
 */

const vercelBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],

  // Only runs for the live project: undefined unless E2E_LIVE=1, so the mock
  // run never imports it and never needs live creds.
  globalSetup: process.env.E2E_LIVE ? "./e2e/global-setup.ts" : undefined,

  // Global webServer: the LOCAL production server in MOCK mode. The `mock`
  // project relies on this; the `live` project hits DEPLOY_URL instead.
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_USE_MOCK: "true",
      E2E_BYPASS_AUTH: "1",
      PORT: "3100",
    },
  },

  projects: [
    {
      name: "mock",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3100",
      },
    },
    {
      name: "live",
      // globalSetup + storageState scoped HERE so a missing state.json / live
      // creds can never break the mock run.
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.DEPLOY_URL || "http://localhost:3100",
        // storageState is written by globalSetup, which only runs under E2E_LIVE — gate it
        // the same way so a non-live invocation never ENOENTs on a missing state file.
        ...(process.env.E2E_LIVE ? { storageState: "e2e/.auth/state.json" } : {}),
        ...(vercelBypass
          ? {
              extraHTTPHeaders: {
                "x-vercel-protection-bypass": vercelBypass,
                "x-vercel-set-bypass-cookie": "true",
              },
            }
          : {}),
      },
    },
  ],
});

import posthog from "posthog-js";

// Guarded PostHog wrapper for Offload's OWN product funnel (onboarding_completed,
// campaign_generated, post_approved). It is a NO-OP unless NEXT_PUBLIC_POSTHOG_KEY is set, so the
// app builds and runs identically without analytics keys. Founder-facing campaign analytics live in
// Supabase post_metrics — keep the two separate (EXECUTION_PLAN §2 PostHog note).

let initialized = false;
let enabled = false;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return; // no key → stay disabled, track() becomes a no-op
  try {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: true,
      person_profiles: "identified_only",
    });
    enabled = true;
  } catch {
    /* analytics must never break the app */
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (!enabled) return;
  try {
    posthog.capture(event, props);
  } catch {
    /* swallow */
  }
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const ONBOARDED_KEY = "offload_onboarded";

// First-run entry: send users who haven't completed onboarding to /onboarding.
// Source of truth is whether the signed-in account has a `brands` row; localStorage is
// only a fast path so we don't re-query every navigation once we've confirmed onboarding.
export function FirstRunGate() {
  const router = useRouter();
  useEffect(() => {
    let active = true;
    try {
      if (localStorage.getItem(ONBOARDED_KEY)) return;
    } catch {
      /* localStorage unavailable — fall through to the server check */
    }

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) {
          // No session (mock/dev) — fall back to the onboarding flow.
          router.replace("/onboarding");
          return;
        }
        const { data: brand } = await supabase.from("brands").select("account_id").eq("account_id", user.id).maybeSingle();
        if (!active) return;
        if (brand) {
          try {
            localStorage.setItem(ONBOARDED_KEY, "1");
          } catch {
            /* ignore */
          }
        } else {
          router.replace("/onboarding");
        }
      } catch {
        /* network/auth hiccup — let the app render rather than trap the user */
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);
  return null;
}

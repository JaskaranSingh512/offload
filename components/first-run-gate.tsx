"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const ONBOARDED_KEY = "offload_onboarded";

// First-run entry: send users who haven't completed onboarding to /onboarding.
// Once the flag is set (LoadingStep completion) the dashboard loads normally.
// Mock stand-in for the auth/profile check the live app will do server-side.
export function FirstRunGate() {
  const router = useRouter();
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) router.replace("/onboarding");
    } catch {
      /* localStorage unavailable — let the app render */
    }
  }, [router]);
  return null;
}

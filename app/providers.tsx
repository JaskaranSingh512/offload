"use client";

import { Toaster } from "sonner";

// Client provider shell. Currently just hosts the global toaster; this is where
// React Query / PostHog providers will mount when the live data layer is wired.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--espresso)",
            color: "var(--cream)",
            border: "1px solid var(--espresso-90)",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { initAnalytics } from "@/lib/analytics";

// Client provider shell: React Query for the live data layer (lib/queries.ts) + the
// global Sonner toaster. PostHog mounts here too (guarded — no-op without NEXT_PUBLIC_POSTHOG_KEY).
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { OffloadLogo } from "@/components/logo";
import { I } from "@/components/icons";

type AuthState = "checking" | "signed-out" | "unconfigured";

export default function LoginPage() {
  const router = useRouter();
  // Client is created in the browser only (inside the effect), never during the
  // server prerender — createBrowserClient throws if the NEXT_PUBLIC_* env vars are
  // missing, which would crash `next build`.
  const [client, setClient] = useState<SupabaseClient<Database> | null>(null);
  const [state, setState] = useState<AuthState>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let supabase: SupabaseClient<Database>;
    try {
      supabase = createClient();
    } catch {
      setState("unconfigured");
      return;
    }
    setClient(supabase);

    // Surface an OAuth callback error (read from the URL, no Suspense boundary needed).
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) toast.error(`Sign-in failed: ${err}`);

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        // Already signed in — move straight into onboarding rather than showing
        // the "you're signed in" confirmation.
        router.replace("/onboarding");
      } else {
        setState("signed-out");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace("/onboarding");
      } else {
        setState("signed-out");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const signInWith = async (provider: "github" | "google") => {
    if (!client) return;
    setBusy(true);
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  };

  return (
    <div className="onb-wrap">
      <div className="onb-topbar">
        <OffloadLogo markSize={24} wordSize={20} />
      </div>

      <div className="onb-body">
        <div className="onb-card" style={{ maxWidth: 420, textAlign: "center" }}>
          {state === "checking" && (
            <>
              <div className="onb-step-label">Authentication</div>
              <h1 className="onb-title">Checking session…</h1>
            </>
          )}

          {state === "unconfigured" && (
            <>
              <div className="onb-step-label">Authentication</div>
              <h1 className="onb-title">Supabase isn&rsquo;t configured</h1>
              <p className="onb-sub">
                Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code>.env.local</code>
                {" "}(see <code>.env.example</code>), then restart the dev server.
              </p>
            </>
          )}

          {state === "signed-out" && (
            <>
              <div className="onb-step-label">Authentication</div>
              <h1 className="onb-title">Sign in to Offload</h1>
              <p className="onb-sub">
                Use your GitHub account to continue. We only read your basic profile to
                create your workspace.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => signInWith("github")}
                  disabled={busy}
                  style={{ width: "100%", justifyContent: "center", gap: 10 }}
                >
                  <I.GitHub size={18} />
                  {busy ? "Redirecting…" : "Continue with GitHub"}
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => signInWith("google")}
                  disabled={busy}
                  style={{ width: "100%", justifyContent: "center", gap: 10 }}
                >
                  <I.Google size={18} />
                  {busy ? "Redirecting…" : "Continue with Google"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

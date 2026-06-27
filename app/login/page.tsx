"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { OffloadLogo } from "@/components/logo";
import { I } from "@/components/icons";

type AuthState = "checking" | "signed-out" | "signed-in";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<AuthState>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Surface an OAuth callback error (read from the URL, no Suspense boundary needed).
    const err = new URLSearchParams(window.location.search).get("error");
    if (err) toast.error(`Sign-in failed: ${err}`);

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setEmail(data.user.email ?? data.user.id);
        setState("signed-in");
      } else {
        setState("signed-out");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setEmail(session.user.email ?? session.user.id);
        setState("signed-in");
      } else {
        setState("signed-out");
        setEmail(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/login` },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
    // On success the browser navigates to GitHub; no need to reset busy.
  };

  const signOut = async () => {
    setBusy(true);
    await supabase.auth.signOut();
    toast.success("Signed out");
    setBusy(false);
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

          {state === "signed-out" && (
            <>
              <div className="onb-step-label">Authentication</div>
              <h1 className="onb-title">Sign in to Offload</h1>
              <p className="onb-sub">
                Use your GitHub account to continue. We only read your basic profile to
                create your workspace.
              </p>
              <div className="onb-actions" style={{ justifyContent: "center", marginTop: 24 }}>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={signIn}
                  disabled={busy}
                  style={{ width: "100%", justifyContent: "center", gap: 10 }}
                >
                  <I.GitHub size={18} />
                  {busy ? "Redirecting…" : "Continue with GitHub"}
                </button>
              </div>
            </>
          )}

          {state === "signed-in" && (
            <>
              <div
                className="onb-step-label"
                style={{ color: "var(--teal)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <I.Check size={15} /> GitHub auth is working
              </div>
              <h1 className="onb-title">You&rsquo;re signed in</h1>
              <p className="onb-sub">
                Signed in as <strong>{email}</strong>. A matching{" "}
                <code>accounts</code> row was provisioned by the <code>handle_new_user</code>{" "}
                trigger.
              </p>
              <div className="onb-actions" style={{ justifyContent: "center", marginTop: 24 }}>
                <button
                  className="btn btn-secondary"
                  onClick={signOut}
                  disabled={busy}
                  style={{ justifyContent: "center", gap: 8 }}
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

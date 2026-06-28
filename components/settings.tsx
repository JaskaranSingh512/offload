"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { I } from "@/components/icons";
import { PageHead, Toggle } from "@/components/ui";
import { ONBOARDED_KEY } from "@/components/first-run-gate";
import { createClient } from "@/lib/supabase/client";
import { useSocialAccounts, useDisconnectAccount } from "@/lib/queries";
import { channelMeta, type ChannelId } from "@/lib/data";

type Policy = "approve" | "auto";

// social_accounts.status → human chip label + tone for the Connected accounts card.
const STATUS_CHIP: Record<string, { label: string; teal: boolean }> = {
  mock: { label: "Connected (demo)", teal: true },
  connected: { label: "Connected", teal: true },
  read_only: { label: "Read-only", teal: false },
  expired: { label: "Expired", teal: false },
  disconnected: { label: "Not connected", teal: false },
};

const NOTIFS = [
  { id: "approval", label: "Approval needed", desc: "A post on an approve-each channel is queued and waiting." },
  { id: "spike", label: "Performance spike", desc: "A post is materially outperforming forecast." },
  { id: "milestones", label: "Campaign milestones", desc: "Mid-campaign check-in, ending soon, recap ready." },
  { id: "filming", label: "Filming reminder", desc: "Unfilmed scripts are blocking the calendar." },
] as const;

export const Settings = () => {
  const router = useRouter();
  const [policy, setPolicy] = useState<Record<ChannelId, Policy>>({
    reddit: "approve",
    tiktok: "approve",
    instagram: "approve",
    x: "approve",
  });
  const [email, setEmail] = useState<Record<string, boolean>>({ approval: true, spike: true, milestones: true, filming: true });
  const [push, setPush] = useState<Record<string, boolean>>({ approval: true, spike: false, milestones: false, filming: true });
  const [signingOut, setSigningOut] = useState(false);

  const channels = Object.keys(channelMeta) as ChannelId[];
  const { data: socialAccounts } = useSocialAccounts();
  const disconnect = useDisconnectAccount();
  const statusFor = (id: ChannelId) => socialAccounts?.find((a) => a.provider === id)?.status ?? "disconnected";

  const signOut = async () => {
    setSigningOut(true);
    try {
      await createClient().auth.signOut();
    } catch {
      // If Supabase isn't configured, fall through to /login anyway.
    }
    router.push("/login");
  };

  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Settings"
        title='Workspace <span class="em">settings.</span>'
        sub="How Offload publishes, connects, and keeps you in the loop."
        actions={
          <button className="btn btn-primary" onClick={() => toast.success("Settings saved.")}>
            <I.Check size={13} /> Save changes
          </button>
        }
      />

      {/* Brand */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3 className="card-title">Brand</h3>
        </div>
        <div className="settings-row">
          <div className="avatar" style={{ borderRadius: 10 }}>BL</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--espresso)" }}>Brew Lab</div>
            <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>brewlab.co · Small-batch cold brew, brewed slow.</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              try {
                localStorage.removeItem(ONBOARDED_KEY);
              } catch {
                /* ignore */
              }
              router.push("/onboarding");
            }}
          >
            <I.Repeat size={12} /> Replay onboarding
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast("Edit brand details.")}>
            <I.Edit size={12} /> Edit
          </button>
        </div>
      </div>

      {/* Approval policy */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3 className="card-title">Approval policy</h3>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Default is approve-each on every channel
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {channels.map((id) => {
            const meta = channelMeta[id];
            const isVideo = id === "tiktok";
            return (
              <div key={id} className="settings-channel-row">
                <div className="cb-icon" style={{ background: meta.color }}>
                  <meta.Icon size={14} />
                </div>
                <span className="cb-name" style={{ flex: 1 }}>{meta.name}</span>
                {isVideo ? (
                  <span className="chip">Founder-posted · video</span>
                ) : (
                  <div className="seg" style={{ width: 260 }} role="group" aria-label={`${meta.name} approval policy`}>
                    <button
                      className={policy[id] === "approve" ? "on" : ""}
                      aria-pressed={policy[id] === "approve"}
                      onClick={() => setPolicy({ ...policy, [id]: "approve" })}
                    >
                      Approve each
                    </button>
                    <button
                      className={policy[id] === "auto" ? "on" : ""}
                      aria-pressed={policy[id] === "auto"}
                      onClick={() => setPolicy({ ...policy, [id]: "auto" })}
                    >
                      Auto-publish
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="field-hint" style={{ marginTop: 12 }}>
          &quot;Scheduled&quot; means drafted and placed on the calendar, pending approval. TikTok and founder video are always posted by you —
          Offload never auto-publishes video.
        </p>
      </div>

      {/* Connected accounts */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head">
          <h3 className="card-title">Connected accounts</h3>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Read-only for analytics · write scopes per channel
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {channels.map((id) => {
            const meta = channelMeta[id];
            const isVideo = id === "tiktok";
            const status = statusFor(id);
            const chip = STATUS_CHIP[status] ?? STATUS_CHIP.disconnected;
            const isConnected = status === "mock" || status === "connected" || status === "read_only";
            return (
              <div key={id} className="settings-channel-row">
                <div className="cb-icon" style={{ background: meta.color }}>
                  <meta.Icon size={14} />
                </div>
                <span className="cb-name" style={{ flex: 1 }}>{meta.name}</span>
                {isVideo ? (
                  <span className="chip" style={{ marginRight: 8 }}>Founder-posted · video</span>
                ) : (
                  <>
                    <span className={`chip ${chip.teal ? "chip-teal" : ""}`} style={{ marginRight: 8 }}>
                      {chip.teal && <span className="chip-dot" />} {chip.label}
                    </span>
                    {isConnected && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() =>
                          disconnect.mutate(id, {
                            onSuccess: () => toast(`Disconnected ${meta.name}.`),
                            onError: () => toast.error(`Couldn't disconnect ${meta.name} — try again.`),
                          })
                        }
                      >
                        Disconnect
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">Notifications</h3>
          <span className="text-muted" style={{ fontSize: 12 }}>
            Email opt-out · push opt-in
          </span>
        </div>
        <div className="settings-notif-head">
          <span style={{ flex: 1 }} />
          <span className="settings-notif-col">Email</span>
          <span className="settings-notif-col">Push</span>
        </div>
        {NOTIFS.map((n) => (
          <div key={n.id} className="settings-notif-row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--espresso)" }}>{n.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{n.desc}</div>
            </div>
            <span className="settings-notif-col">
              <Toggle on={email[n.id]} onChange={(v) => setEmail({ ...email, [n.id]: v })} />
            </span>
            <span className="settings-notif-col">
              <Toggle on={push[n.id]} onChange={(v) => setPush({ ...push, [n.id]: v })} />
            </span>
          </div>
        ))}
      </div>

      {/* Account */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3 className="card-title">Account</h3>
        </div>
        <div className="settings-row">
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--espresso)" }}>Sign out</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              End your session on this device. You&rsquo;ll return to the sign-in screen.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={signOut} disabled={signingOut}>
            <I.LogOut size={12} /> {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
};

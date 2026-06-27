"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { PageHead } from "@/components/ui";
import { Toggle } from "@/components/ui";
import { OffloadMark } from "@/components/logo";
import { channelMeta, type ChannelId } from "@/lib/data";

export const CampaignBuilder = () => {
  const router = useRouter();
  const [goal, setGoal] = useState("awareness");
  const [duration, setDuration] = useState("2w");
  const [frequency, setFrequency] = useState("balanced");
  const [channels, setChannels] = useState<Record<ChannelId, boolean>>({ reddit: true, tiktok: true, instagram: true, x: false });
  const [campaignName, setCampaignName] = useState("Honest Cold Brew — Late Spring");
  const [generating, setGenerating] = useState(false);

  const goals = [
    { id: "awareness", label: "Grow awareness", sub: "Maximize impressions", icon: I.Megaphone },
    { id: "orders", label: "Drive orders", sub: "Convert to purchase", icon: I.Dollar },
    { id: "launch", label: "Launch a product", sub: "Hype for a release", icon: I.Bolt },
    { id: "community", label: "Build community", sub: "Grow followers", icon: I.Users },
  ];

  const channelsList: { id: ChannelId; name: string; color: string; Icon: typeof I.Reddit }[] = [
    { id: "reddit", name: "Reddit", color: "#FF4500", Icon: I.Reddit },
    { id: "tiktok", name: "TikTok", color: "#111111", Icon: I.TikTok },
    { id: "instagram", name: "Instagram", color: "#E1306C", Icon: I.Instagram },
    { id: "x", name: "X", color: "#000000", Icon: I.XLogo },
  ];

  // Estimated post count
  const activeChannels = Object.values(channels).filter(Boolean).length;
  const days = duration === "1w" ? 7 : duration === "2w" ? 14 : duration === "4w" ? 28 : 14;
  const freqMult = frequency === "light" ? 1.5 : frequency === "balanced" ? 2.5 : 4;
  const estPosts = Math.round(days * (freqMult / 4) * activeChannels);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => router.push("/calendar"), 2400);
  };

  if (generating) {
    return (
      <div className="loader-wrap" style={{ minHeight: "100%" }}>
        <div className="loader-card">
          <div className="loader-mark"><OffloadMark size={34} /></div>
          <h2 className="loader-title">Generating &quot;{campaignName}&quot;</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            Drafting {estPosts} posts across {activeChannels} channels…
          </p>
          <div className="loader-progress">
            <div style={{ width: "70%", transition: "width 2.4s linear" }} />
          </div>
          <div className="loader-status">
            <I.Sparkle size={13} style={{ color: "var(--teal)" }} />
            <span>Writing copy in your voice…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Create"
        title='Build a <span class="em">new campaign.</span>'
        sub="Offload will research, write, and schedule. You review and approve."
        actions={
          <button className="btn btn-ghost" onClick={() => router.push("/")}>
            <I.ArrowLeft size={14} /> Back to dashboard
          </button>
        }
      />

      <div className="builder-grid">
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Campaign name</h3>
            </div>
            <input className="input" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Goal</h3>
              <span className="text-muted" style={{ fontSize: 12 }}>
                What success looks like
              </span>
            </div>
            <div className="opt-grid">
              {goals.map((g) => (
                <button key={g.id} className={`opt-card ${goal === g.id ? "on" : ""}`} onClick={() => setGoal(g.id)}>
                  <div className="opt-icon">
                    <g.icon size={16} />
                  </div>
                  <h4 className="opt-title">{g.label}</h4>
                  <p className="opt-desc">{g.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Duration</h3>
            </div>
            <div className="seg">
              <button className={duration === "1w" ? "on" : ""} onClick={() => setDuration("1w")}>
                1 week
              </button>
              <button className={duration === "2w" ? "on" : ""} onClick={() => setDuration("2w")}>
                2 weeks
              </button>
              <button className={duration === "4w" ? "on" : ""} onClick={() => setDuration("4w")}>
                4 weeks
              </button>
              <button className={duration === "custom" ? "on" : ""} onClick={() => setDuration("custom")}>
                Custom…
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Channels</h3>
            </div>
            <div className="flex flex-col gap-2">
              {channelsList.map((c) => (
                <div key={c.id} className={`channel-card ${channels[c.id] ? "on" : ""}`}>
                  <div className="ch-icon" style={{ background: c.color }}>
                    <c.Icon size={20} />
                  </div>
                  <div className="ch-meta">
                    <h4 className="ch-name">{c.name}</h4>
                    <p className="ch-desc">
                      {c.id === "reddit" && "~2 posts/week · long-form"}
                      {c.id === "tiktok" && "~5 posts/week · slideshows"}
                      {c.id === "instagram" && "~5 posts/week · carousels + posts"}
                      {c.id === "x" && "~3 posts/week · threads + posts"}
                    </p>
                  </div>
                  <Toggle on={channels[c.id]} onChange={(v) => setChannels({ ...channels, [c.id]: v })} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">Posting frequency</h3>
            </div>
            <div className="seg">
              <button className={frequency === "light" ? "on" : ""} onClick={() => setFrequency("light")}>
                Light · 1/day
              </button>
              <button className={frequency === "balanced" ? "on" : ""} onClick={() => setFrequency("balanced")}>
                Balanced · 2-3/day
              </button>
              <button className={frequency === "aggressive" ? "on" : ""} onClick={() => setFrequency("aggressive")}>
                Aggressive · 4+/day
              </button>
            </div>
            <p className="field-hint" style={{ marginTop: 10 }}>
              Offload will distribute posts intelligently across your channels and times based on when your audience is most active.
            </p>
          </div>
        </div>

        {/* Summary card */}
        <div className="card summary-card">
          <div className="card-head">
            <h3 className="card-title">Campaign summary</h3>
            <span className="chip chip-teal">
              <span className="chip-dot" /> Ready
            </span>
          </div>

          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              lineHeight: 1.2,
              color: "var(--espresso)",
              letterSpacing: "-0.01em",
              marginBottom: 4,
            }}
          >
            {campaignName}
          </div>
          <div className="text-muted" style={{ fontSize: 13, marginBottom: 18 }}>
            for <strong style={{ color: "var(--espresso)" }}>Brew Lab</strong>
          </div>

          <div className="summary-row">
            <span className="sr-label">Goal</span>
            <span className="sr-value">{goals.find((g) => g.id === goal)?.label}</span>
          </div>
          <div className="summary-row">
            <span className="sr-label">Duration</span>
            <span className="sr-value">{days} days</span>
          </div>
          <div className="summary-row">
            <span className="sr-label">Channels</span>
            <span className="sr-value flex gap-2 items-center">
              {(Object.keys(channels) as ChannelId[])
                .filter((c) => channels[c])
                .map((c) => {
                  const meta = channelMeta[c];
                  return (
                    <span key={c} style={{ background: meta.color, borderRadius: 4, padding: 3, display: "inline-flex" }}>
                      <meta.Icon size={11} />
                    </span>
                  );
                })}
            </span>
          </div>
          <div className="summary-row">
            <span className="sr-label">Frequency</span>
            <span className="sr-value">{frequency === "light" ? "Light" : frequency === "balanced" ? "Balanced" : "Aggressive"}</span>
          </div>
          <div className="summary-row">
            <span className="sr-label">Est. posts</span>
            <span className="sr-value" style={{ fontFamily: "var(--font-serif)", fontSize: 24, color: "var(--teal-deep)" }}>
              {estPosts}
            </span>
          </div>
          <div className="summary-row">
            <span className="sr-label">Est. impressions</span>
            <span className="sr-value">{(estPosts * 5400).toLocaleString()}</span>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleGenerate} style={{ width: "100%", marginTop: 20 }}>
            <I.Sparkle size={14} /> Generate campaign
          </button>
          <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 10, textAlign: "center", margin: "10px 0 0" }}>
            You&apos;ll review every post before it&apos;s scheduled.
          </p>
        </div>
      </div>
    </div>
  );
};

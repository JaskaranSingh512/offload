"use client";

import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { PageHead, ChannelIcon, LineChart } from "@/components/ui";
import { useUI } from "@/lib/store";
import { posts, TODAY_DAY, channelMeta, type ChannelId } from "@/lib/data";

export const Dashboard = () => {
  const router = useRouter();
  const openPost = useUI((s) => s.openPost);
  // "Next up" posts (today + tomorrow, upcoming only)
  const nextUp = posts.filter((p) => p.day === TODAY_DAY || p.day === TODAY_DAY + 1).slice(0, 5);

  // Channel breakdown (count of posts per channel)
  const channelCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.channel] = (acc[p.channel] || 0) + 1;
    return acc;
  }, {});
  const maxChannel = Math.max(...Object.values(channelCounts));

  // Mini 7-day line chart (impressions trend simulated)
  const trendData = [
    { label: "M5", value: 12 },
    { label: "T6", value: 18 },
    { label: "W7", value: 26 },
    { label: "T8", value: 22 },
    { label: "F9", value: 34 },
    { label: "S10", value: 30 },
    { label: "S11", value: 41 },
  ];

  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Good morning"
        title='Wednesday, <span class="em">May 7</span>'
        sub="Day 3 of your launch campaign · 3 posts scheduled today"
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => router.push("/calendar")}>
              <I.Calendar /> View calendar
            </button>
            <button className="btn btn-primary" onClick={() => router.push("/build")}>
              <I.Plus /> New campaign
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi">
          <p className="kpi-label">Impressions (7d)</p>
          <p className="kpi-value">142.8k</p>
          <span className="kpi-delta">
            <I.ArrowUp size={11} /> +24% vs prior
          </span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Signups (7d)</p>
          <p className="kpi-value">312</p>
          <span className="kpi-delta">
            <I.ArrowUp size={11} /> +41%
          </span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Engagement rate</p>
          <p className="kpi-value">6.4%</p>
          <span className="kpi-delta">
            <I.ArrowUp size={11} /> +1.2pt
          </span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Posts scheduled</p>
          <p className="kpi-value">35</p>
          <span className="kpi-delta" style={{ background: "var(--cream)", color: "var(--espresso)" }}>
            over 14 days
          </span>
        </div>
      </div>

      <div className="dash-grid">
        {/* Active Campaign Hero */}
        <div className="card active-campaign">
          <div className="ac-bg" />
          <div className="ac-inner">
            <div className="ac-eyebrow">Active campaign · day 3 of 14</div>
            <h2 className="ac-name">The Honest Cold Brew — Spring Launch</h2>
            <p className="ac-dates">May 5 – May 18, 2025 · Across Reddit, TikTok, Instagram, X</p>

            <div className="ac-stats">
              <div className="ac-stat">
                <p className="label">Posted</p>
                <p className="value">
                  8 <span style={{ fontSize: 14, color: "rgba(245,239,230,0.5)" }}>/ 35</span>
                </p>
              </div>
              <div className="ac-stat">
                <p className="label">Next post</p>
                <p className="value" style={{ fontSize: 22 }}>
                  9:00 AM
                </p>
              </div>
              <div className="ac-stat">
                <p className="label">Forecast</p>
                <p className="value" style={{ fontSize: 22 }}>
                  ~58k <span style={{ fontSize: 13, color: "rgba(245,239,230,0.5)" }}>imp / day</span>
                </p>
              </div>
            </div>

            <div className="ac-progress">
              <div style={{ width: "21%" }} />
            </div>
            <div className="ac-progress-meta">
              <span>21% complete</span>
              <span>11 days remaining</span>
            </div>

            <div className="ac-actions">
              <button className="btn btn-on-dark" onClick={() => router.push("/calendar")}>
                Open campaign →
              </button>
              <button className="btn btn-on-dark ghost" onClick={() => router.push("/analytics")}>
                View live analytics
              </button>
            </div>
          </div>
        </div>

        {/* Next Up */}
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Next up</h3>
            <button className="card-link" onClick={() => router.push("/calendar")}>
              See all <I.ChevronRight size={12} />
            </button>
          </div>
          {nextUp.map((p) => (
            <div key={p.id} className="next-up-row" style={{ cursor: "pointer" }} onClick={() => openPost(p)}>
              <div className="nu-time">
                {p.day === TODAY_DAY ? "Today" : "Tomorrow"} · {p.time}
              </div>
              <ChannelIcon channel={p.channel} size={22} />
              <div className="nu-meta">
                <p className="nu-title">{p.title}</p>
                <p className="nu-sub">
                  {channelMeta[p.channel].name} · {p.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="dash-grid" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Signups trend · last 7 days</h3>
            <span className="chip chip-teal">+41% vs prior week</span>
          </div>
          <LineChart data={trendData.map((d) => ({ ...d, value: d.value * 7.6 }))} height={200} />
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">By channel · this campaign</h3>
            <button className="card-link" onClick={() => router.push("/analytics")}>
              Deep dive <I.ChevronRight size={12} />
            </button>
          </div>
          {Object.entries(channelCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([ch, count]) => {
              const meta = channelMeta[ch as ChannelId];
              return (
                <div key={ch} className="channel-bar">
                  <div className="cb-icon" style={{ background: meta.color }}>
                    <meta.Icon size={14} />
                  </div>
                  <span className="cb-name">{meta.name}</span>
                  <div className="cb-track">
                    <div className="cb-fill" style={{ width: `${(count / maxChannel) * 100}%`, background: meta.color }} />
                  </div>
                  <span className="cb-value">{count} posts</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Offload suggests card */}
      <div className="card" style={{ marginTop: 20, padding: 24, display: "flex", gap: 24, alignItems: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "var(--cream)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <I.Sparkle size={22} style={{ color: "var(--espresso)" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="eyebrow" style={{ color: "var(--teal-deep)" }}>
            Offload suggests
          </div>
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              margin: "4px 0 4px",
              color: "var(--espresso)",
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
            }}
          >
            Your &quot;4am bottling&quot; TikTok is outperforming — want me to brief a follow-up for next Wednesday?
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            71k views, 8.4% engagement, +28 signups in 18 hours. The format is working.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary">Dismiss</button>
          <button className="btn btn-teal">
            Draft follow-up <I.Arrow size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

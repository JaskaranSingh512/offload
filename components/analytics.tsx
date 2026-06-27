"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { I } from "@/components/icons";
import { OffloadMark } from "@/components/logo";
import { PageHead, Chip, BarChart, LineChart } from "@/components/ui";
import { channelStats, formatStats, working, recommendations, channelMeta } from "@/lib/data";

type Mode = "inflight" | "recap";

// Full 14-day impressions; in-flight only knows the days elapsed so far.
const dailyData = [
  { label: "5", value: 4200 },
  { label: "6", value: 9100 },
  { label: "7", value: 12400 },
  { label: "8", value: 18900 },
  { label: "9", value: 28000 },
  { label: "10", value: 24000 },
  { label: "11", value: 31000 },
  { label: "12", value: 42000 },
  { label: "13", value: 38000 },
  { label: "14", value: 56000 },
  { label: "15", value: 62000 },
  { label: "16", value: 71000 },
  { label: "17", value: 68000 },
  { label: "18", value: 80000 },
];

const channelBars = channelStats.map((c) => ({
  label: channelMeta[c.channel].name,
  value: c.signups,
  color: channelMeta[c.channel].color,
}));

const ModeToggle = ({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) => (
  <div className="seg" style={{ width: 220 }}>
    <button className={mode === "inflight" ? "on" : ""} onClick={() => setMode("inflight")}>
      In-flight
    </button>
    <button className={mode === "recap" ? "on" : ""} onClick={() => setMode("recap")}>
      Recap
    </button>
  </div>
);

export const Analytics = () => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("recap");

  if (mode === "inflight") {
    return <InFlight router={router} mode={mode} setMode={setMode} />;
  }
  return <Recap router={router} mode={mode} setMode={setMode} />;
};

type ViewProps = { router: ReturnType<typeof useRouter>; mode: Mode; setMode: (m: Mode) => void };

const InFlight = ({ router, mode, setMode }: ViewProps) => {
  const live = dailyData.slice(0, 3); // day 3 of 14
  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Campaign analytics"
        title='Day 3 — <span class="em">in flight.</span>'
        sub="The Honest Cold Brew — Spring Launch · tracking live against forecast"
        actions={
          <>
            <ModeToggle mode={mode} setMode={setMode} />
            <button className="btn btn-primary" onClick={() => router.push("/build")}>
              <I.Sparkle size={13} /> Brief next campaign
            </button>
          </>
        }
      />

      <div className="kpi-row">
        <div className="kpi">
          <p className="kpi-label">Impressions (so far)</p>
          <p className="kpi-value">25.7k</p>
          <span className="kpi-delta"><I.ArrowUp size={11} /> +12% vs forecast</span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Signups (so far)</p>
          <p className="kpi-value">198</p>
          <span className="kpi-delta"><I.ArrowUp size={11} /> +9%</span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Engagement rate</p>
          <p className="kpi-value">6.1%</p>
          <span className="kpi-delta"><I.ArrowUp size={11} /> +0.8pt</span>
        </div>
        <div className="kpi">
          <p className="kpi-label">Posts published</p>
          <p className="kpi-value">8</p>
          <span className="kpi-delta" style={{ background: "var(--cream)", color: "var(--espresso)" }}>of 35</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">Daily impressions · so far</h3>
            <span className="chip">vs forecast</span>
          </div>
          <LineChart data={live} secondaryData={live.map((d, i) => ({ ...d, value: d.value * (0.8 + i / 30) }))} height={220} />
        </div>
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">Signups by channel</h3>
            <span className="chip">live</span>
          </div>
          <BarChart data={channelBars.map((b) => ({ ...b, value: Math.round(b.value * 0.4) }))} height={200} />
        </div>
      </div>

      <div className="card card-pad-lg" style={{ marginTop: 20 }}>
        <div className="card-head">
          <h3 className="card-title">What&apos;s working so far</h3>
          <Chip tone="teal" dot>
            early signal
          </Chip>
        </div>
        <div className="working-list">
          {working.slice(0, 3).map((w, i) => (
            <div key={i} className="working-item">
              <div className="wi-dot" />
              <div>
                <h5>{w.title}</h5>
                <p>{w.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Recap = ({ router, mode, setMode }: ViewProps) => {
  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Campaign recap"
        title='2 weeks <span class="em">in review.</span>'
        sub="The Honest Cold Brew — Spring Launch · May 5 to May 18, 2025"
        actions={
          <>
            <ModeToggle mode={mode} setMode={setMode} />
            <button className="btn btn-secondary">
              <I.Copy size={13} /> Export PDF
            </button>
            <button className="btn btn-primary" onClick={() => router.push("/build")}>
              <I.Sparkle size={13} /> Brief next campaign
            </button>
          </>
        }
      />

      {/* Recap hero */}
      <div className="recap-hero">
        <div>
          <div className="eyebrow rh-eyebrow">Campaign verdict</div>
          <h2>
            This campaign was a <span className="em">win.</span>
          </h2>
          <p style={{ fontSize: 16, color: "var(--text-muted)", lineHeight: 1.55, margin: 0, maxWidth: 460 }}>
            815k impressions and 1,235 signups across 35 posts — meaningfully ahead of forecast on three of your four channels. Most of the lift
            came from two things we should keep doing.
          </p>
          <div className="flex gap-2 mt-6">
            <Chip tone="teal" dot>
              +34% vs forecast
            </Chip>
            <Chip>$0.42 CAC</Chip>
            <Chip>92% audience sentiment</Chip>
          </div>
        </div>

        <div className="rh-stats">
          <div className="rh-stat">
            <p className="label">Total impressions</p>
            <p className="value">815k</p>
            <span className="delta">
              <I.ArrowUp size={11} /> +34%
            </span>
          </div>
          <div className="rh-stat">
            <p className="label">Signups</p>
            <p className="value">1,235</p>
            <span className="delta">
              <I.ArrowUp size={11} /> +61%
            </span>
          </div>
          <div className="rh-stat">
            <p className="label">Engagement</p>
            <p className="value">6.8%</p>
            <span className="delta">
              <I.ArrowUp size={11} /> +1.4pt
            </span>
          </div>
          <div className="rh-stat">
            <p className="label">Cost per signup</p>
            <p className="value">$0.42</p>
            <span className="delta">
              <I.ArrowDown size={11} /> –52%
            </span>
          </div>
        </div>
      </div>

      {/* Daily impressions chart + channel breakdown */}
      <div className="analytics-grid">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">Daily impressions · 14 days</h3>
            <div className="flex gap-3 items-center" style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <span className="flex items-center gap-2">
                <span style={{ width: 12, height: 2, background: "var(--teal)", display: "inline-block" }} /> Impressions
              </span>
              <span className="flex items-center gap-2">
                <span style={{ width: 12, height: 2, background: "var(--espresso-50)", borderTop: "1px dashed", display: "inline-block" }} /> Forecast
              </span>
            </div>
          </div>
          <LineChart
            data={dailyData}
            secondaryData={dailyData.map((d, i) => ({ ...d, value: d.value * (0.7 + i / 30) }))}
            height={240}
          />
          <div className="flex gap-6 mt-6" style={{ fontSize: 12, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                Peak day
              </div>
              <div style={{ fontSize: 14, color: "var(--espresso)", fontWeight: 500 }}>May 18 · 80,400 imp</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                Best post
              </div>
              <div style={{ fontSize: 14, color: "var(--espresso)", fontWeight: 500 }}>Reddit AMA · 142k</div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 4 }}>
                Avg daily growth
              </div>
              <div style={{ fontSize: 14, color: "var(--espresso)", fontWeight: 500 }}>+8.4%</div>
            </div>
          </div>
        </div>

        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">Signups by channel</h3>
            <span className="chip">14d total</span>
          </div>
          <BarChart data={channelBars} height={200} />
          <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            {channelStats.map((c) => {
              const meta = channelMeta[c.channel];
              const total = channelStats.reduce((a, b) => a + b.signups, 0);
              const pct = ((c.signups / total) * 100).toFixed(0);
              return (
                <div key={c.channel} className="channel-bar" style={{ padding: "8px 0" }}>
                  <div className="cb-icon" style={{ background: meta.color, width: 22, height: 22, borderRadius: 6 }}>
                    <meta.Icon size={11} />
                  </div>
                  <span className="cb-name" style={{ width: 76, fontSize: 12.5 }}>
                    {meta.name}
                  </span>
                  <span className="text-mono" style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}>
                    {c.signups} signups · {c.ctr}% CTR
                  </span>
                  <span className="cb-value">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Format performance + What's working */}
      <div className="analytics-grid">
        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">Performance by format</h3>
            <span className="chip">
              <I.Sparkle size={10} /> Stars are top performers
            </span>
          </div>
          <table className="format-table">
            <thead>
              <tr>
                <th>Format</th>
                <th style={{ textAlign: "right" }}>Impressions</th>
                <th style={{ textAlign: "right" }}>Engagement</th>
                <th style={{ textAlign: "right" }}>Signups</th>
              </tr>
            </thead>
            <tbody>
              {formatStats.map((f, i) => {
                const meta = channelMeta[f.channel];
                return (
                  <tr key={i} className={f.winner ? "winner-row" : ""}>
                    <td>
                      <div className="format-name">{f.name}</div>
                      <div className="format-channel">{meta.name}</div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12 }}>{f.impressions.toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        className="chip"
                        style={{
                          background: f.eng > 7 ? "var(--teal-soft)" : "var(--surface-2)",
                          color: f.eng > 7 ? "var(--teal-deep)" : "var(--text-muted)",
                          border: "none",
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                        }}
                      >
                        {f.eng}%
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 500, fontFamily: "var(--font-serif)", fontSize: 16, color: "var(--espresso)" }}>
                      {f.signups}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card card-pad-lg">
          <div className="card-head">
            <h3 className="card-title">What&apos;s working</h3>
            <Chip tone="teal" dot>
              4 themes
            </Chip>
          </div>
          <div className="working-list">
            {working.map((w, i) => (
              <div key={i} className="working-item">
                <div className="wi-dot" />
                <div>
                  <h5>{w.title}</h5>
                  <p>{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations — the closer */}
      <div className="rec-card" style={{ marginTop: 24 }}>
        <div className="rc-head">
          <div className="rc-offload-mark"><OffloadMark size={18} /></div>
          <div>
            <div className="rc-title">Offload recommends</div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 28, color: "var(--cream)", letterSpacing: "-0.01em", marginTop: 2 }}>
              Your next move, ranked.
            </div>
          </div>
          <button
            className="btn btn-on-dark"
            style={{ marginLeft: "auto", background: "var(--teal)", color: "white", borderColor: "var(--teal)" }}
            onClick={() => router.push("/build")}
          >
            <I.Sparkle size={13} /> Brief next campaign
          </button>
        </div>
        <div className="rc-list">
          {recommendations.map((r, i) => (
            <div key={i} className="rc-item">
              <div className="rc-num">{String(i + 1).padStart(2, "0")}</div>
              <div>
                <h4>{r.title}</h4>
                <p>{r.detail}</p>
                <span className="rc-tag">{r.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

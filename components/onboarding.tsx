"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { I } from "@/components/icons";
import { Toggle } from "@/components/ui";
import { OffloadLogo, OffloadMark } from "@/components/logo";
import { ONBOARDED_KEY } from "@/components/first-run-gate";
import { createClient } from "@/lib/supabase/client";
import { api } from "@/lib/api";
import type { ChannelId } from "@/lib/data";

// UI voice id → DB voice_t enum.
const VOICE_DB: Record<string, string> = {
  "warm-witty": "warm_witty",
  authoritative: "authoritative",
  playful: "playful",
  editorial: "editorial",
};

const CHANNEL_LABEL: Record<ChannelId, string> = {
  reddit: "Reddit",
  tiktok: "TikTok",
  instagram: "Instagram",
  x: "X",
};

export interface BrandData {
  name: string;
  oneLiner: string;
  voice: string;
  audience: string;
  goal: string;
  channels: Record<ChannelId, boolean>;
  docName?: string;
  docText?: string;
}

export interface Analysis {
  industry: string;
  recommended_channels: ChannelId[];
  channel_rationale: string;
}

const INITIAL: BrandData = {
  name: "Brew Lab",
  oneLiner: "Small-batch cold brew, brewed slow.",
  voice: "warm-witty",
  audience:
    "Remote workers and creatives, 25–40, who care about quality and aesthetics. Spend on coffee at home. Follow design + lifestyle accounts.",
  goal: "awareness",
  channels: { reddit: true, tiktok: true, instagram: true, x: false },
};

// ===== ONBOARDING FLOW =====
export const Onboarding = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<BrandData>(INITIAL);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const steps = ["welcome", "brand", "audience", "channels", "connect", "loading"];
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const persistBrand = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // not signed in (mock/dev) — skip the write, still complete
      await supabase.from("brands").upsert(
        {
          account_id: user.id,
          name: data.name || null,
          one_liner: data.oneLiner || null,
          voice: (VOICE_DB[data.voice] ?? "warm_witty") as never,
          audience: data.audience || null,
          goal: data.goal as never,
          doc_name: data.docName ?? null,
          doc_text: data.docText ?? null,
          industry: analysis?.industry ?? null,
          recommended_channels: analysis?.recommended_channels ?? [],
          channel_rationale: analysis?.channel_rationale ?? null,
        },
        { onConflict: "account_id" },
      );
    } catch {
      /* non-fatal for the demo — onboarding still completes */
    }
  };

  const complete = () => {
    void persistBrand();
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      /* ignore */
    }
    router.push("/");
  };

  return (
    <div className="onb-wrap">
      <div className="onb-topbar">
        <OffloadLogo markSize={24} wordSize={20} />
        <div className="onb-progress">
          <span>
            Step {step + 1} of {steps.length}
          </span>
          <div className="onb-progress-bar">
            <div className="onb-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="onb-body">
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && (
          <BrandStep
            data={data}
            setData={setData}
            analysis={analysis}
            setAnalysis={setAnalysis}
            onNext={next}
            onBack={prev}
          />
        )}
        {step === 2 && <AudienceStep data={data} setData={setData} onNext={next} onBack={prev} />}
        {step === 3 && <ChannelsStep data={data} setData={setData} analysis={analysis} onNext={next} onBack={prev} />}
        {step === 4 && <ConnectStep onNext={next} onBack={prev} />}
        {step === 5 && <LoadingStep onComplete={complete} />}
      </div>
    </div>
  );
};

const Welcome = ({ onNext }: { onNext: () => void }) => (
  <div className="onb-card welcome-hero">
    <div className="onb-step-label">Welcome to Offload</div>
    <h1 className="word">
      Marketing,
      <br />
      <span className="em">offloaded.</span>
    </h1>
    <p className="tagline">
      Tell us about your brand once. We&apos;ll research your market, build a 2-week multi-channel campaign, schedule it, and tell you what&apos;s working.
    </p>
    <div className="welcome-grid">
      <div className="wg-card">
        <div className="wg-icon">
          <I.Beaker size={18} />
        </div>
        <h3 className="wg-title">Researches your market</h3>
        <p className="wg-desc">Pulls competitor angles, audience signals, and proven hooks.</p>
      </div>
      <div className="wg-card">
        <div className="wg-icon">
          <I.Calendar size={18} />
        </div>
        <h3 className="wg-title">Builds a 2-week campaign</h3>
        <p className="wg-desc">Generated posts across Reddit, TikTok, Instagram, and X.</p>
      </div>
      <div className="wg-card">
        <div className="wg-icon">
          <I.TrendUp size={18} />
        </div>
        <h3 className="wg-title">Tells you what works</h3>
        <p className="wg-desc">Recommends what to double down on and where to put paid budget.</p>
      </div>
    </div>
    <button className="btn btn-primary btn-lg" onClick={onNext}>
      Get started <I.Arrow />
    </button>
    <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 20 }}>Takes about 3 minutes. No credit card required.</p>
  </div>
);

type StepProps = {
  data: BrandData;
  setData: React.Dispatch<React.SetStateAction<BrandData>>;
  onNext: () => void;
  onBack: () => void;
};

const BrandStep = ({
  data,
  setData,
  analysis,
  setAnalysis,
  onNext,
  onBack,
}: StepProps & { analysis: Analysis | null; setAnalysis: (a: Analysis | null) => void }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const colors = [
    { name: "Espresso", hex: "#3B2417", role: "primary" },
    { name: "Cream", hex: "#F5EFE6", role: "background" },
    { name: "Teal", hex: "#1FA89B", role: "accent" },
  ];

  const voices = [
    { id: "warm-witty", label: "Warm + witty", sub: "Friendly, a little irreverent" },
    { id: "authoritative", label: "Authoritative", sub: "Expert, measured, confident" },
    { id: "playful", label: "Playful", sub: "Energetic, casual, fun" },
    { id: "editorial", label: "Editorial", sub: "Thoughtful, considered, slow" },
  ];

  const onDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!/\.(md|txt)$/i.test(file.name)) {
      toast.error("Upload a .md or .txt file.");
      return;
    }
    const text = await file.text();
    setData((d) => ({ ...d, docName: file.name, docText: text }));
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ doc_text: text, doc_name: file.name, name: data.name, audience: data.audience, goal: data.goal }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const result: Analysis = await res.json();
      setAnalysis(result);
      // Pre-select the recommended channels (does not restrict — all 4 stay available).
      setData((d) => ({
        ...d,
        channels: {
          reddit: result.recommended_channels.includes("reddit"),
          tiktok: result.recommended_channels.includes("tiktok"),
          instagram: result.recommended_channels.includes("instagram"),
          x: result.recommended_channels.includes("x"),
        },
      }));
      toast.success("Brand analyzed — channels pre-selected.");
    } catch {
      toast.error("Couldn't analyze the doc. You can still pick channels manually.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="onb-card">
      <div className="onb-step-label">01 · Brand</div>
      <h1 className="onb-title">
        Tell us about <span className="em">your brand.</span>
      </h1>
      <p className="onb-sub">We pre-filled some details from your domain. Adjust anything that&apos;s not quite right.</p>

      <div className="flex flex-col gap-4">
        <div className="flex gap-4" style={{ alignItems: "stretch" }}>
          {/* Logo upload */}
          <div className="field" style={{ flex: "0 0 140px" }}>
            <span className="field-label">Logo</span>
            <button
              style={{
                width: 140,
                height: 140,
                border: "1.5px dashed var(--border-strong)",
                borderRadius: 12,
                background: "var(--cream)",
                display: "grid",
                placeItems: "center",
                color: "var(--espresso)",
                cursor: "pointer",
                position: "relative",
                padding: 0,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 38, fontStyle: "italic", marginBottom: 6 }}>bl</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <I.Upload size={11} /> Replace
                </div>
              </div>
            </button>
          </div>

          <div className="flex flex-col gap-3" style={{ flex: 1 }}>
            <label className="field">
              <span className="field-label">Brand name</span>
              <input className="input" value={data.name} onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))} />
            </label>
            <label className="field">
              <span className="field-label">One-line description</span>
              <input className="input" value={data.oneLiner} onChange={(e) => setData((d) => ({ ...d, oneLiner: e.target.value }))} />
            </label>
          </div>
        </div>

        {/* Brand doc → AI channel strategy */}
        <div className="field">
          <span className="field-label">Brand document</span>
          <div className="asset-row">
            <label className="asset-tile asset-add" style={{ cursor: "pointer" }}>
              <I.Upload size={16} />
              <span>{data.docName ? "Replace doc" : "Upload .md / .txt"}</span>
              <input type="file" accept=".md,.txt,text/markdown,text/plain" onChange={onDoc} style={{ display: "none" }} />
            </label>
            {data.docName && (
              <div className="asset-tile" style={{ opacity: 0.9 }}>
                <I.Sparkle size={16} />
                <span>{data.docName}</span>
              </div>
            )}
          </div>
          <span className="field-hint">
            Drop a one-page brand brief and Offload recommends which channels to lead with. Markdown or plain text.
          </span>

          {analyzing && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: "var(--cream)",
                borderRadius: 10,
                fontSize: 13,
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <I.Sparkle size={14} style={{ color: "var(--teal-deep)" }} /> Analyzing your brand…
            </div>
          )}

          {analysis && !analyzing && (
            <div
              style={{
                marginTop: 12,
                padding: "14px 16px",
                background: "var(--teal-soft)",
                borderRadius: 10,
                fontSize: 13.5,
                color: "var(--espresso)",
                lineHeight: 1.5,
              }}
            >
              <div className="eyebrow" style={{ color: "var(--teal-deep)", marginBottom: 6 }}>
                Offload recommends
              </div>
              We&apos;d lead on{" "}
              <strong>{analysis.recommended_channels.map((c) => CHANNEL_LABEL[c]).join(" + ")}</strong> — {analysis.channel_rationale}
            </div>
          )}
        </div>

        <div className="field">
          <span className="field-label">Brand colors</span>
          <div className="swatch-row">
            {colors.map((c) => (
              <div className="swatch" key={c.name}>
                <div className="chip-color" style={{ background: c.hex }} />
                <div className="swatch-meta">
                  <span className="name">{c.name}</span>
                  <span className="hex">{c.hex.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Brand voice</span>
          <div className="opt-grid">
            {voices.map((v) => (
              <button
                key={v.id}
                className={`opt-card ${data.voice === v.id ? "on" : ""}`}
                aria-pressed={data.voice === v.id}
                onClick={() => setData((d) => ({ ...d, voice: v.id }))}
              >
                <div className="opt-icon">
                  <I.Mic size={16} />
                </div>
                <h4 className="opt-title">{v.label}</h4>
                <p className="opt-desc">{v.sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">Brand assets</span>
          <div className="asset-row">
            {["Logo mark", "Product photo", "Label shot"].map((label) => (
              <div key={label} className="asset-tile">
                <I.Image size={18} />
                <span>{label}</span>
              </div>
            ))}
            <button className="asset-tile asset-add" type="button">
              <I.Upload size={16} />
              <span>Upload</span>
            </button>
          </div>
          <span className="field-hint">Logos, product photos, and fonts. Offload composes carousels and overlays from these so visuals stay on-brand.</span>
        </div>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          <I.ArrowLeft size={14} /> Back
        </button>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onNext}>
          Continue <I.Arrow />
        </button>
      </div>
    </div>
  );
};

const AudienceStep = ({ data, setData, onNext, onBack }: StepProps) => {
  const goals = [
    { id: "awareness", label: "Grow awareness", sub: "Get in front of people who don't know us yet.", icon: I.Megaphone },
    { id: "orders", label: "Drive first orders", sub: "Convert new audience into paying customers.", icon: I.Dollar },
    { id: "community", label: "Build community", sub: "Grow an audience that follows along.", icon: I.Users },
    { id: "launch", label: "Launch a product", sub: "Build hype around a specific release.", icon: I.Bolt },
  ];

  return (
    <div className="onb-card">
      <div className="onb-step-label">02 · Audience &amp; Goals</div>
      <h1 className="onb-title">
        Who are you reaching, <span className="em">and why?</span>
      </h1>
      <p className="onb-sub">The clearer this is, the better Offload&apos;s first campaign will be.</p>

      <div className="flex flex-col gap-4">
        <label className="field">
          <span className="field-label">Who do you serve?</span>
          <textarea
            className="textarea"
            value={data.audience}
            onChange={(e) => setData((d) => ({ ...d, audience: e.target.value }))}
            rows={3}
          />
          <span className="field-hint">Describe your ideal customer in a sentence or two. Demographics, what they care about, what they spend on.</span>
        </label>

        <div className="field">
          <span className="field-label">What are you trying to accomplish?</span>
          <div className="opt-grid">
            {goals.map((g) => (
              <button
                key={g.id}
                className={`opt-card ${data.goal === g.id ? "on" : ""}`}
                aria-pressed={data.goal === g.id}
                onClick={() => setData((d) => ({ ...d, goal: g.id }))}
              >
                <div className="opt-icon">
                  <g.icon size={16} />
                </div>
                <h4 className="opt-title">{g.label}</h4>
                <p className="opt-desc">{g.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          <I.ArrowLeft size={14} /> Back
        </button>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onNext}>
          Continue <I.Arrow />
        </button>
      </div>
    </div>
  );
};

const ChannelsStep = ({ data, setData, analysis, onNext, onBack }: StepProps & { analysis: Analysis | null }) => {
  const channels: { id: ChannelId; name: string; desc: string; color: string; Icon: typeof I.Reddit }[] = [
    { id: "reddit", name: "Reddit", desc: "Long-form posts, AMAs, niche subreddits.", color: "#FF4500", Icon: I.Reddit },
    { id: "tiktok", name: "TikTok", desc: "Slideshow + talking-head, 15–60s.", color: "#111111", Icon: I.TikTok },
    { id: "instagram", name: "Instagram", desc: "Carousels and single-image posts.", color: "#E1306C", Icon: I.Instagram },
    { id: "x", name: "X", desc: "Short posts and threads.", color: "#000000", Icon: I.XLogo },
  ];
  const set = (id: ChannelId, v: boolean) => setData((d) => ({ ...d, channels: { ...d.channels, [id]: v } }));

  return (
    <div className="onb-card">
      <div className="onb-step-label">03 · Channels</div>
      <h1 className="onb-title">
        Where should we <span className="em">publish?</span>
      </h1>
      <p className="onb-sub">
        {analysis
          ? "Based on your brand doc, we've pre-selected the channels to lead with. Toggle any you'd like to add or drop."
          : "Toggle the channels you want Offload to plan content for. You can add more later — these defaults work for most brands."}
      </p>

      {analysis && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            background: "var(--teal-soft)",
            borderRadius: 10,
            fontSize: 13,
            color: "var(--espresso)",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <I.Sparkle size={14} style={{ marginTop: 1, flexShrink: 0, color: "var(--teal-deep)" }} />
          <span>
            Leading on <strong>{analysis.recommended_channels.map((c) => CHANNEL_LABEL[c]).join(" + ")}</strong> for your{" "}
            {analysis.industry} brand.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {channels.map((c) => (
          <div key={c.id} className={`channel-card ${data.channels[c.id] ? "on" : ""}`}>
            <div className="ch-icon" style={{ background: c.color }}>
              <c.Icon size={20} />
            </div>
            <div className="ch-meta">
              <h4 className="ch-name">{c.name}</h4>
              <p className="ch-desc">{c.desc}</p>
            </div>
            <Toggle on={data.channels[c.id]} onChange={(v) => set(c.id, v)} />
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "var(--cream)",
          borderRadius: 10,
          fontSize: 12.5,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <I.Bell size={14} style={{ marginTop: 1, flexShrink: 0, color: "var(--espresso)" }} />
        <span>Next, you&apos;ll connect these accounts so Offload can publish on your behalf and learn from your post history.</span>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          <I.ArrowLeft size={14} /> Back
        </button>
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onNext}>
          Continue <I.Arrow />
        </button>
      </div>
    </div>
  );
};

const ConnectStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const [connected, setConnected] = useState<Record<ChannelId, boolean>>({ reddit: false, tiktok: false, instagram: false, x: false });
  const channels: { id: ChannelId; name: string; handle: string; color: string; Icon: typeof I.Reddit }[] = [
    { id: "reddit", name: "Reddit", handle: "u/brewlab_andre", color: "#FF4500", Icon: I.Reddit },
    { id: "tiktok", name: "TikTok", handle: "@brewlab", color: "#111111", Icon: I.TikTok },
    { id: "instagram", name: "Instagram", handle: "@brewlab.co", color: "#E1306C", Icon: I.Instagram },
    { id: "x", name: "X", handle: "@brewlab", color: "#000000", Icon: I.XLogo },
  ];
  const anyConnected = Object.values(connected).some(Boolean);

  return (
    <div className="onb-card">
      <div className="onb-step-label">04 · Connect accounts</div>
      <h1 className="onb-title">
        Connect your <span className="em">handles.</span>
      </h1>
      <p className="onb-sub">
        Offload reads your post history to personalize the campaign, and publishes approved posts for you. Read-only to start — you grant
        publishing access per channel later.
      </p>

      <div className="flex flex-col gap-2">
        {channels.map((c) => (
          <div key={c.id} className={`channel-card ${connected[c.id] ? "on" : ""}`}>
            <div className="ch-icon" style={{ background: c.color }}>
              <c.Icon size={20} />
            </div>
            <div className="ch-meta">
              <h4 className="ch-name">{c.name}</h4>
              <p className="ch-desc">{connected[c.id] ? `Connected · ${c.handle}` : "Not connected"}</p>
            </div>
            {connected[c.id] ? (
              <span className="chip chip-teal" style={{ flexShrink: 0 }}>
                <I.Check size={12} /> Connected
              </span>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setConnected({ ...connected, [c.id]: true })}>
                Connect
              </button>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          padding: "12px 14px",
          background: "var(--cream)",
          borderRadius: 10,
          fontSize: 12.5,
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <I.Bell size={14} style={{ marginTop: 1, flexShrink: 0, color: "var(--espresso)" }} />
        <span>
          Connections are simulated in this build (real OAuth needs platform review). You can skip and Offload will run in manual-post mode —
          it drafts, you post.
        </span>
      </div>

      <div className="onb-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          <I.ArrowLeft size={14} /> Back
        </button>
        {!anyConnected && (
          <button className="btn btn-ghost" onClick={onNext}>
            Skip for now
          </button>
        )}
        <button className="btn btn-primary" style={{ marginLeft: "auto" }} onClick={onNext}>
          Generate my first campaign <I.Sparkle size={14} />
        </button>
      </div>
    </div>
  );
};

const LoadingStep = ({ onComplete }: { onComplete: () => void }) => {
  const tasks = [
    "Analyzing brewlab.co and your social presence…",
    "Identifying 4 main competitors and what they're publishing…",
    "Mapping audience overlap on Reddit, TikTok, Instagram…",
    "Generating 12 content angles for your brand voice…",
    "Drafting 35 posts across 4 channels…",
    "Scheduling your 2-week launch campaign…",
  ];
  const [taskIdx, setTaskIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const start = Date.now();
    const finish = () => {
      if (done) return;
      done = true;
      setProgress(100);
      setTaskIdx(tasks.length - 1);
      // Keep the loader on screen at least ~1.6s even if generation returns instantly (mock/golden).
      const wait = Math.max(0, 1600 - (Date.now() - start));
      timer = setTimeout(onComplete, wait + 300);
    };

    (async () => {
      try {
        const res = await api.generate({});
        if (!res.body) return finish();
        reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let ticks = 0;
        for (;;) {
          const { value, done: rd } = await reader.read();
          if (done || rd) break;
          buf += dec.decode(value, { stream: true });
          const frames = buf.split("\n\n");
          buf = frames.pop() ?? "";
          for (const f of frames) {
            if (f.includes("event: token")) {
              ticks++;
              setProgress(Math.min(95, 8 + ticks * 3));
              setTaskIdx(Math.min(tasks.length - 1, Math.floor(ticks / 4)));
            } else if (f.includes("event: done") || f.includes("event: error")) {
              return finish();
            }
          }
        }
        finish();
      } catch {
        finish(); // never dead-end the demo
      }
    })();

    return () => {
      done = true;
      if (timer) clearTimeout(timer);
      reader?.cancel().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="loader-wrap" style={{ minHeight: "auto", flex: 1, width: "100%" }}>
      <div className="loader-card">
        <div className="loader-mark"><OffloadMark size={34} /></div>
        <h2 className="loader-title">Building your first campaign</h2>
        <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
          This usually takes about 3 seconds. In production it&apos;d be more like 30.
        </p>

        <div className="loader-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="loader-status">
          <I.Sparkle size={13} style={{ color: "var(--teal)" }} />
          <span>{tasks[taskIdx]}</span>
        </div>

        <div className="loader-checks">
          {tasks.map((t, i) => (
            <div key={i} className={`loader-check ${i < taskIdx ? "done" : i === taskIdx ? "active" : ""}`}>
              <span className="check-dot">{i < taskIdx && <I.Check />}</span>
              <span>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

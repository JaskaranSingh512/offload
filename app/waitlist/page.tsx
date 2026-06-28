"use client";

import { useRouter } from "next/navigation";
import { OffloadLogo } from "@/components/logo";

const CHANNELS = [
  { label: "Instagram", color: "#E1306C" },
  { label: "TikTok",    color: "#25F4EE" },
  { label: "Reddit",    color: "#FF4500" },
  { label: "X",         color: "#ffffff" },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "linear-gradient(135deg, #0F1419 0%, #1a1a2e 60%, #0F1419 100%)",
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        padding:        "40px 24px",
        fontFamily:     "var(--font-sans, sans-serif)",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <OffloadLogo markSize={32} wordSize={26} />
      </div>

      {/* Card */}
      <div
        style={{
          maxWidth:       520,
          width:          "100%",
          background:     "rgba(255,255,255,0.04)",
          border:         "1px solid rgba(255,255,255,0.08)",
          borderRadius:   20,
          padding:        "48px 40px",
          textAlign:      "center",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Pill */}
        <div
          style={{
            display:      "inline-flex",
            alignItems:   "center",
            gap:          6,
            background:   "rgba(99,102,241,0.15)",
            border:       "1px solid rgba(99,102,241,0.3)",
            borderRadius: 40,
            padding:      "6px 14px",
            marginBottom: 24,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
          <span style={{ color: "#a5b4fc", fontSize: 13, fontWeight: 600 }}>
            AI marketing autopilot
          </span>
        </div>

        <h1
          style={{
            fontSize:      42,
            fontWeight:    800,
            color:         "#ffffff",
            margin:        "0 0 16px",
            lineHeight:    1.15,
            letterSpacing: "-1px",
          }}
        >
          Marketing on autopilot.
          <br />
          <span style={{ color: "#818cf8" }}>Built for founders.</span>
        </h1>

        <p
          style={{
            fontSize:   17,
            color:      "rgba(255,255,255,0.55)",
            lineHeight: 1.6,
            margin:     "0 0 36px",
          }}
        >
          Upload your product brief. Offload researches your market, writes your
          posts, and publishes across{" "}
          {CHANNELS.map((c, i) => (
            <span key={c.label}>
              <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>
              {i < CHANNELS.length - 1 ? (i === CHANNELS.length - 2 ? " and " : ", ") : ""}
            </span>
          ))}{" "}
          — while you focus on building.
        </p>

        <button
          onClick={() => router.push("/login")}
          style={{
            width:        "100%",
            padding:      "16px 24px",
            background:   "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border:       "none",
            borderRadius: 10,
            color:        "#ffffff",
            fontSize:     17,
            fontWeight:   700,
            cursor:       "pointer",
            letterSpacing: "-0.3px",
          }}
        >
          Get started →
        </button>

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
          Free to try · No credit card required
        </p>
      </div>

      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 32 }}>
        Offload · AI marketing for solo founders
      </p>
    </div>
  );
}

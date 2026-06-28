"use client";

import { useState } from "react";
import { OffloadLogo } from "@/components/logo";

const CHANNELS = [
  { label: "Instagram", color: "#E1306C" },
  { label: "TikTok",    color: "#25F4EE" },
  { label: "Reddit",    color: "#FF4500" },
  { label: "X",         color: "#ffffff" },
];

type State = "idle" | "loading" | "done" | "error";

export default function WaitlistPage() {
  const [email, setEmail]   = useState("");
  const [state, setState]   = useState<State>("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");

    const res = await fetch("/api/waitlist", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setState("error");
      setMessage(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setState("done");
    setMessage(
      data.already
        ? "You're already on the list — we'll be in touch."
        : "You're in! We'll reach out when Offload is ready."
    );
  };

  return (
    <div
      style={{
        minHeight:       "100vh",
        background:      "linear-gradient(135deg, #0F1419 0%, #1a1a2e 60%, #0F1419 100%)",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        padding:         "40px 24px",
        fontFamily:      "var(--font-sans, sans-serif)",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: 48 }}>
        <OffloadLogo markSize={32} wordSize={26} />
      </div>

      {/* Card */}
      <div
        style={{
          maxWidth:     520,
          width:        "100%",
          background:   "rgba(255,255,255,0.04)",
          border:       "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding:      "48px 40px",
          textAlign:    "center",
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
            Early access
          </span>
        </div>

        <h1
          style={{
            fontSize:     42,
            fontWeight:   800,
            color:        "#ffffff",
            margin:       "0 0 16px",
            lineHeight:   1.15,
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
            margin:     "0 0 32px",
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

        {state === "done" ? (
          <div
            style={{
              padding:      "20px 24px",
              background:   "rgba(99,102,241,0.12)",
              border:       "1px solid rgba(99,102,241,0.25)",
              borderRadius: 12,
              color:        "#a5b4fc",
              fontSize:     16,
              fontWeight:   500,
            }}
          >
            {message}
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width:        "100%",
                padding:      "14px 18px",
                background:   "rgba(255,255,255,0.06)",
                border:       "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                color:        "#ffffff",
                fontSize:     16,
                outline:      "none",
              }}
            />
            {state === "error" && (
              <p style={{ color: "#f87171", fontSize: 14, margin: 0 }}>{message}</p>
            )}
            <button
              type="submit"
              disabled={state === "loading"}
              style={{
                padding:      "14px 24px",
                background:   state === "loading" ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border:       "none",
                borderRadius: 10,
                color:        "#ffffff",
                fontSize:     16,
                fontWeight:   700,
                cursor:       state === "loading" ? "not-allowed" : "pointer",
                transition:   "opacity 0.15s",
              }}
            >
              {state === "loading" ? "Joining…" : "Join the waitlist"}
            </button>
          </form>
        )}

        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
          No spam. Unsubscribe anytime.
        </p>
      </div>

      {/* Social proof */}
      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 32 }}>
        Offload · AI marketing for solo founders
      </p>
    </div>
  );
}

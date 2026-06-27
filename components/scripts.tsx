"use client";

import { toast } from "sonner";
import { I } from "@/components/icons";
import { PageHead } from "@/components/ui";
import { founderScripts } from "@/lib/data";

export const Scripts = () => {
  return (
    <div className="main-inner">
      <PageHead
        eyebrow="Founder Scripts"
        title='Scripts for <span class="em">you</span> to film.'
        sub="Talking-head scripts written for you to record yourself. Distinct from auto-posted content — these need your face, your voice."
        actions={
          <>
            <button className="btn btn-secondary">
              <I.Plus size={13} /> Request new script
            </button>
            <button className="btn btn-primary">
              <I.Film size={13} /> Open in shooter mode
            </button>
          </>
        }
      />

      {/* Filter row */}
      <div className="flex gap-2 items-center" style={{ marginBottom: 24 }}>
        <button className="btn btn-sm btn-primary">All · 4</button>
        <button className="btn btn-sm btn-ghost">Founder confession</button>
        <button className="btn btn-sm btn-ghost">Numbers explainer</button>
        <button className="btn btn-sm btn-ghost">Lessons learned</button>
        <button className="btn btn-sm btn-ghost">Behind the scenes</button>
        <div className="text-mono text-muted" style={{ marginLeft: "auto", fontSize: 12 }}>
          <span style={{ color: "var(--text-muted)" }}>~4 minutes of total footage</span>
        </div>
      </div>

      <div className="scripts-grid">
        {founderScripts.map((s) => (
          <article className="script-card" key={s.id}>
            <div className="script-card-head">
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>
                  {s.angle}
                </div>
                <h3 className="sc-title">{s.title}</h3>
                <div className="sc-meta">
                  <span>
                    <I.Clock size={11} style={{ verticalAlign: "-1px" }} /> {s.duration}
                  </span>
                  <span>·</span>
                  <span>{s.platforms.join(", ")}</span>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" title="Copy">
                <I.Copy size={13} />
              </button>
            </div>

            <p className="sc-hook">&quot;{s.hook.replace(/^"|"$/g, "")}&quot;</p>

            <div>
              <div className="eyebrow" style={{ marginBottom: 8 }}>
                Beats
              </div>
              <div className="sc-beats">
                {s.beats.map((b, i) => (
                  <div key={i} className="sc-beat">
                    <span className="beat-time">{b.time}</span>
                    <span
                      className="beat-text"
                      dangerouslySetInnerHTML={{ __html: b.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontStyle: "italic",
                padding: "10px 12px",
                background: "var(--surface-2)",
                borderRadius: 8,
                borderLeft: "2px solid var(--border-strong)",
              }}
            >
              <strong style={{ color: "var(--espresso)", fontStyle: "normal" }}>Shot note · </strong>
              {s.note}
            </div>

            <div className="sc-foot">
              <button className="btn btn-secondary btn-sm">
                <I.Edit size={12} /> Edit
              </button>
              <button className="btn btn-secondary btn-sm">
                <I.Wand size={12} /> Variations
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginLeft: "auto" }}
                onClick={() => toast.success(`"${s.title}" marked filmed — its calendar slot is now active.`)}
              >
                <I.Film size={12} /> Mark filmed
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* CTA at bottom */}
      <div className="card" style={{ marginTop: 24, padding: 28, textAlign: "center", background: "var(--cream)" }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: "0 auto 14px",
            borderRadius: 10,
            background: "var(--espresso)",
            color: "var(--cream)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <I.Mic size={18} />
        </div>
        <h3 style={{ fontFamily: "var(--font-serif)", fontSize: 24, margin: 0, color: "var(--espresso)", letterSpacing: "-0.01em" }}>
          Need a different angle?
        </h3>
        <p style={{ fontSize: 13.5, color: "var(--text-muted)", maxWidth: 480, margin: "8px auto 18px" }}>
          Tell Offload what you want to talk about and it&apos;ll draft a new script in your voice.
        </p>
        <button className="btn btn-primary">
          <I.Sparkle size={13} /> Brief a new script
        </button>
      </div>
    </div>
  );
};

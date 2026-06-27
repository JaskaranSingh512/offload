"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { I } from "@/components/icons";
import { OffloadMark } from "@/components/logo";
import { useUI } from "@/lib/store";

interface ProposedChange {
  summary: string;
  detail: string;
}

interface Message {
  role: "user" | "offload";
  text: string;
  change?: ProposedChange;
}

// Maps a natural-language instruction to a mock "structured change" the user
// previews + confirms — the instruction-layer-over-UI behavior from PRD §6.6.
function respondTo(input: string): Message {
  const q = input.toLowerCase();
  if (q.includes("warmer") || q.includes("rewrite") || q.includes("tone")) {
    return {
      role: "offload",
      text: "Here's a warmer rewrite. Preview the change and apply it if it reads right.",
      change: { summary: "Rewrite post copy — warmer tone", detail: "Softens the opening line and adds a first-person aside. Same length, same claim." },
    };
  }
  if (q.includes("reddit") || q.includes("add") || q.includes("more")) {
    return {
      role: "offload",
      text: "I can add 3 Reddit posts to week 2, spaced across Tue/Thu/Sat mornings.",
      change: { summary: "Add 3 Reddit posts to week 2", detail: "Drafts 3 long-form posts in your voice and places them at 8:30am on May 13, 15, 17." },
    };
  }
  if (q.includes("shift") || q.includes("later") || q.includes("reschedul")) {
    return {
      role: "offload",
      text: "I'll shift every scheduled post one day later and keep the per-channel times.",
      change: { summary: "Shift all posts +1 day", detail: "Moves 27 pending posts forward one day; published posts are untouched." },
    };
  }
  if (q.includes("why") || q.includes("work")) {
    return {
      role: "offload",
      text: "Your Reddit AMA drove the most signups (312) because it led with specifics — price, temperature, batch size — before mentioning the brand. Numbers-forward founder posts outperform promo by 4.2x in r/Coffee.",
    };
  }
  return {
    role: "offload",
    text: "Got it — I'll draft that and show you a preview before anything changes. Try asking me to rewrite a post, add posts to a week, or shift the schedule.",
  };
}

const SUGGESTIONS = ["Rewrite this post warmer", "Add 3 Reddit posts to week 2", "Why did the AMA work?"];

export const ChatLauncher = () => {
  const open = useUI((s) => s.chatOpen);
  const toggle = useUI((s) => s.toggleChat);
  const setOpen = useUI((s) => s.setChatOpen);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "offload",
      text: "I'm Offload. Ask me anything about your campaign, or tell me what to change — I'll show you a preview before applying it.",
    },
  ]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed }, respondTo(trimmed)]);
  };

  return (
    <>
      <button className={`chat-fab ${open ? "open" : ""}`} onClick={toggle} aria-label={open ? "Close chat" : "Ask Offload"}>
        {open ? <I.X size={20} /> : <OffloadMark size={24} />}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Ask Offload">
          <div className="chat-head">
            <div className="chat-head-mark">
              <OffloadMark size={16} />
            </div>
            <div>
              <div className="chat-head-title">Ask Offload</div>
              <div className="chat-head-sub">Instruction layer · previews before it applies</div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", padding: 6 }} onClick={toggle} aria-label="Close chat">
              <I.X size={16} />
            </button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className="chat-bubble">{m.text}</div>
                {m.change && (
                  <div className="chat-change">
                    <div className="chat-change-head">
                      <I.Sparkle size={12} /> Proposed change
                    </div>
                    <div className="chat-change-summary">{m.change.summary}</div>
                    <div className="chat-change-detail">{m.change.detail}</div>
                    <div className="chat-change-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => toast("Change discarded.")}>
                        Discard
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => toast.success("Change applied.")}>
                        <I.Check size={12} /> Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chat-chip" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          <form
            className="chat-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="input"
              placeholder="Tell Offload what to change…"
              aria-label="Message Offload"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button className="btn btn-primary" type="submit" style={{ padding: "10px 12px" }} aria-label="Send">
              <I.Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

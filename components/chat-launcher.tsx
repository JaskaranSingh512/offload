"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { I } from "@/components/icons";
import { OffloadMark } from "@/components/logo";
import { useUI } from "@/lib/store";
import { useChatEdit, useApplyPatch } from "@/lib/queries";
import type { PostContent } from "@/lib/types/content";

interface ProposedChange {
  summary: string;
  detail: string;
}

interface Message {
  role: "user" | "offload";
  text: string;
  change?: ProposedChange; // mock heuristic preview (schedule-level asks)
  patch?: { postId: string; content: PostContent; summary: string }; // real single-post edit
}

// Maps a natural-language instruction to a mock "structured change" the user previews + confirms
// — the instruction-layer-over-UI behavior from PRD §6.6. Used when no post is open (schedule-level
// asks); single-post edits go through the live /api/chat-edit path instead.
function respondTo(input: string): Message {
  const q = input.toLowerCase();
  if (q.includes("reddit") || q.includes("add") || q.includes("more")) {
    return {
      role: "offload",
      text: "I can add 3 Reddit posts to week 2, spaced across Tue/Thu/Sat mornings.",
      change: { summary: "Add 3 Reddit posts to week 2", detail: "Drafts 3 long-form posts in your voice and places them at 8:30am on Jun 30, Jul 2, and Jul 4." },
    };
  }
  if (q.includes("shift") || q.includes("later") || q.includes("reschedul")) {
    return {
      role: "offload",
      text: "I'll shift every scheduled post one day later and keep the per-channel times.",
      change: { summary: "Shift all posts +1 day", detail: "Moves pending posts forward one day; published posts are untouched." },
    };
  }
  if (q.includes("why") || q.includes("work")) {
    return {
      role: "offload",
      text: "Numbers-forward founder posts outperform promo by ~4.2x in r/Coffee — leading with specifics (price, temp, batch size) earns credibility before the brand shows up.",
    };
  }
  return {
    role: "offload",
    text: "Open a post and tell me how to change it (e.g. “rewrite this warmer”) — I'll preview the edit before it applies. Or ask me to add posts or shift the schedule.",
  };
}

// One-line preview of a proposed content patch for the chat card.
function previewOf(content: PostContent): string {
  const c = content as Record<string, unknown>;
  if (typeof c.body === "string") return c.body;
  if (Array.isArray(c.tweets) && typeof c.tweets[0] === "string") return c.tweets[0];
  if (typeof c.caption === "string") return c.caption;
  if (Array.isArray(c.slides) && c.slides[0] && typeof (c.slides[0] as { heading?: string }).heading === "string")
    return (c.slides[0] as { heading: string }).heading;
  if (typeof c.hook === "string") return c.hook;
  return "Updated content ready to apply.";
}

const GENERAL_SUGGESTIONS = ["Add 3 Reddit posts to week 2", "Shift all posts +1 day", "Why did the AMA work?"];
const POST_SUGGESTIONS = ["Rewrite this warmer", "Make it punchier", "Add a concrete number"];

export const ChatLauncher = () => {
  const open = useUI((s) => s.chatOpen);
  const toggle = useUI((s) => s.toggleChat);
  const setOpen = useUI((s) => s.setChatOpen);
  const openedPost = useUI((s) => s.openedPost);
  const chatEdit = useChatEdit();
  const applyPatch = useApplyPatch();
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
      text: "I'm Offload. Open a post and tell me what to change — I'll preview the edit before applying it.",
    },
  ]);

  const scopedPostId = openedPost?.dbId;

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed }]);

    if (scopedPostId) {
      chatEdit.mutate(
        { postId: scopedPostId, message: trimmed },
        {
          onSuccess: (res) =>
            setMessages((m) => [
              ...m,
              { role: "offload", text: res.summary, patch: { postId: res.postId, content: res.proposed_content, summary: res.summary } },
            ]),
          onError: (e) => setMessages((m) => [...m, { role: "offload", text: `Couldn't edit that: ${e.message}` }]),
        },
      );
    } else {
      setMessages((m) => [...m, respondTo(trimmed)]);
    }
  };

  const apply = (patch: { postId: string; content: PostContent }) => {
    applyPatch.mutate(patch, {
      onSuccess: () => toast.success("Change applied — your post is updated."),
      onError: (e) => toast.error(e.message),
    });
  };

  const suggestions = scopedPostId ? POST_SUGGESTIONS : GENERAL_SUGGESTIONS;

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
              <div className="chat-head-sub">
                {scopedPostId ? `Editing: ${openedPost?.title?.slice(0, 40) ?? "this post"}` : "Instruction layer · previews before it applies"}
              </div>
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
                {m.patch && (
                  <div className="chat-change">
                    <div className="chat-change-head">
                      <I.Sparkle size={12} /> Proposed edit
                    </div>
                    <div className="chat-change-summary">{m.patch.summary}</div>
                    <div className="chat-change-detail">{previewOf(m.patch.content)}</div>
                    <div className="chat-change-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => toast("Edit discarded.")}>
                        Discard
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={applyPatch.isPending}
                        onClick={() => apply({ postId: m.patch!.postId, content: m.patch!.content })}
                      >
                        <I.Check size={12} /> {applyPatch.isPending ? "Applying…" : "Apply"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {chatEdit.isPending && <div className="chat-msg offload"><div className="chat-bubble">Drafting the edit…</div></div>}
          </div>

          <div className="chat-suggestions">
            {suggestions.map((s) => (
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
              placeholder={scopedPostId ? "Tell Offload how to edit this post…" : "Tell Offload what to change…"}
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

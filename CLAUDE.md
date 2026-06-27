# Offload

Marketing autopilot for solo founders: a ~3-min onboarding, then it researches
the market, drafts a 2-week multi-channel campaign (Reddit, TikTok, Instagram, X),
schedules/publishes on the founder's behalf, and reports what worked. The founder
stays in control via per-channel approval gates, but the default is the work moves
forward. Stack: Next.js (App Router) + TypeScript + shadcn/ui + Tailwind, deployed
on Vercel; Supabase backend. App is not scaffolded yet.

**Read NOTES.md first** for current state.

See `PRD.md` for full scope — it is the source of truth. Don't restate it here.
PRD §5 (surfaces) and §6 (interactions) are the canonical design/copy reference —
build directly in TSX from them; there is no separate prototype in this build.

## Workflow

All changes go on a **feature branch + PR** — never commit directly to `main`.
Branch from `main` (e.g. `git checkout -b feat/x` or `docs/x`), push, open a PR.

## Execution phases

The build runbook is `EXECUTION_PLAN.md`, ordered as **Phase 0 → 8**. Execute phases
**in order** on the build branch. A phase is **done only when its Verification gate in
EXECUTION_PLAN.md passes** — run that exact gate command and confirm the pass condition
before moving on. Do not start phase N+1 until phase N's gate is green.

**Commit after every phase.** Once a phase's gate passes, commit the work for that phase
with a message `Phase <N>: <name> (gate: <one-line pass condition>)`. One commit per phase
(more is fine mid-phase) so progress is legible and revertable. Then update NOTES.md's
"What's next" to point at the next phase, and commit that too.

| Phase | Name | Done when (gate — see EXECUTION_PLAN §) |
|---|---|---|
| 0 | Contract | `CONTRACT.md` exists with the 13-table list, both status enums, the 5 `posts.content` shapes + founder_scripts shape, and the 3 term defs (§1) |
| 1 | Services | `claude mcp list` shows `supabase` connected; `@anthropic-ai/sdk` requires; MCP `list_tables` returns; `ANTHROPIC_API_KEY` set (§2) |
| 2 | Scaffold | `npm run build`/`typecheck`/`lint` exit 0, `npm run dev` serves `/`; `./verify.sh` exits 0 (§3) |
| 3 | Schema + types + seed | all 13 tables exist; every table reads ≥1 row, `posts` ≥20; types regenerate; `typecheck` exits 0 (§4) |
| 4 | Surfaces | mock renders all 5 surfaces + drawer + chat with no console errors; live reads work with `USE_MOCK=false`; `./verify.sh` exits 0 (§5) |
| 5 | AI Route Handlers | `/api/generate` streams + golden fallback inserts 8 posts; `/api/chat-edit` returns a valid `PostContent` patch; `typecheck` 0 (§6) |
| 6 | OAuth/publish mock | Connect sets `status='mock'`; Approve flips + mock-publishes + toasts; video shows no publish, Mark-filmed works (§7) |
| 7 | Integration + deploy | `./verify.sh` 0; live generate streams from the **deployed URL**; forced-failure streams the golden payload (§8) |
| 8 | E2E + PR | Playwright passes **3×** against the deployed URL; forced-failure golden proven; PR open (§8) |

When unsure whether a phase is done, re-run its gate — the gate is the source of truth,
not your impression of completeness.

## Checking work

Run `./verify.sh` after changes (typecheck + lint + test). It fails open until
the app is scaffolded with matching npm scripts.

## Constraints (the demo depends on these staying true)

- 4 channels only: Reddit, TikTok, Instagram, X. No others in v1.
- TikTok/video is founder-posted — Offload never auto-publishes video.
- Default approval policy is "approve each" per channel; "scheduled" ≠ "published".
- Visual design comes from PRD §5/§6, not invented from scratch.

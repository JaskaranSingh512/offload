# NOTES — edit/overwrite freely, keep it short.

## What works
- **Frontend reflects the full PRD/EXECUTION_PLAN "Offload" vision** (branch `feat/frontend-tether`).
  Rebranded Tether → **Offload** with the real logo (`components/logo.tsx`, from `offload logo.html`).
  Brew Lab is kept intentionally as the canonical demo persona (PRD §2).
- **Real App Router routes** (not single-page state routing): `/onboarding`, `/` (Dashboard),
  `/calendar`, `/build`, `/scripts`, `/analytics`, `/settings`. App shell in `app/(shell)/layout.tsx`
  hosts the sidebar + persistent overlays. UI overlay state in `lib/store.ts` (Zustand); toasts via `sonner`.
- **Net-new PRD §5/§6 surfaces/features (frontend, mock):** onboarding OAuth Connect step + brand-asset
  upload; **Settings** (per-channel approval policy + notification prefs); persistent **chat launcher**
  (§6.6, previews structured changes); **format-aware** Content Detail drawer (§5.4 — video = Mark filmed,
  no publish); **in-flight + recap** Analytics modes; platform-constraint flags.
- `./verify.sh` passes (typecheck + lint + `vitest`) and `next build` static-prerenders all 7 routes.
- `npm run dev` serves at :3000.

## Stack (locked)
- Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel. Supabase backend.
- AI endpoints (`/api/generate`, `/api/chat-edit`) = Next.js Route Handlers (no Express).
- **Design system note:** the visual design is a bespoke hand-rolled CSS system (ported verbatim
  to `app/globals.css` from the prototype's `styles.css`), NOT shadcn/ui. Tailwind v4 is wired up
  for any future components, but screens use the prototype's own classes for pixel fidelity.
  This supersedes the earlier "build from PRD §5/§6, no JSX prototype" plan — we now have the
  prototype and the user asked to build directly from it.

## What's next
- **Follow `EXECUTION_PLAN.md`** — the autonomous build runbook, ordered **Phase 0 → 8** with exact
  non-interactive commands, file paths, and a per-phase Verification gate. CLAUDE.md → "Execution phases"
  has the phase table + the **done = gate passes** and **commit-per-phase** rules.
- **Current position: nothing built — Phase 0 not started.** Do Phase 0 FIRST: write `CONTRACT.md`
  (plural tables, `account_id`, two-column post status, the 5 content JSONB shapes + founder_scripts
  shape, 3 term defs) before any SQL or TSX. Its gate (§1) blocks everything.
- Then in order: Phase 1 services (Supabase + MCP, Anthropic key, Vercel) → 2 scaffold → 3 schema +
  types + seed → 4 surfaces → 5 AI Route Handlers → 6 OAuth/publish mock → 7 integrate + deploy →
  8 Playwright e2e + PR. **Commit after each phase once its gate is green.**
- `package.json` scripts `typecheck` / `lint` (eslint) / `test` turn on `verify.sh`.
- `MVP_12H.md` is a parked alternate (single-channel + Canva, 12h re-scope) — **not** the plan we're
  following. Ignore it unless the scope is explicitly switched back.

## Gotchas
- 4 channels only (Reddit, TikTok, Instagram, X). Video is founder-posted, never auto-published.
- Live demo runs from the deployed Vercel URL — engineer around serverless cold-start/timeout with a
  cached golden-payload fallback.
- Nothing built yet. Repo has docs only; app not scaffolded.

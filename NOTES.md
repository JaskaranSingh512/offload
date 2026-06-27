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
- **Active scope = the 12-Hour MVP integrated into `EXECUTION_PLAN.md` — read §0.5 FIRST.** We build on
  the Next.js + Supabase phased rails (Phase 0 → 8), with the MVP's "brand doc → AI channel strategy"
  folded in. CLAUDE.md → "Execution phases" has the phase table + the **done = gate passes** and
  **commit-per-phase** rules.
- **MVP decisions locked (2026-06-27):** Next.js (not Vite/Express) · **all 4 channels**, but onboarding
  uploads a brand doc and the AI recommends/pre-selects the lead channel(s) (fitness → IG/TikTok; B2B →
  X/Reddit) · `.md`/`.txt` only · **deferred:** Canva render (MCP vs Connect REST) + real GitHub auth —
  stop and ask before building those.
- **Current position: Phase 0 DONE ✅ (branch `docs/phase-0-contract`).** `CONTRACT.md` is frozen (and
  **amended 2026-06-27 for GitHub auth** — see §1a) — plural 13-table list, `account_id` tenant key
  (now `= auth.uid()`, RLS ON), two-column post status (`status`+`approval_state`), the 5 `posts.content`
  JSONB shapes + `founder_scripts` row shape, 3 term defs, **plus the `brands` doc/recommendation columns
  from §0.5**. Phase 0 gate (§1) passes. **Partner schema conflict RESOLVED** (CONTRACT wins; see below).
- **Next: Phase 1 — Services (§2).** Gate: `claude mcp list` shows `supabase` connected; `@anthropic-ai/sdk`
  requires after install; MCP `list_tables` returns; `ANTHROPIC_API_KEY` set in `.env.local`. NOTE: several
  items here are HUMAN PRECONDITIONS (Supabase project, Anthropic key+billing, Vercel token) — if any are
  missing, stop and ask; do not self-provision.
- Then in order: Phase 1 services → 2 scaffold → 3 schema + types + seed → 4 surfaces (incl. onboarding
  doc upload + AI suggestion) → 5 AI Route Handlers (`/api/generate`, `/api/chat-edit`, **`/api/analyze`**)
  → 6 OAuth/publish mock → 7 integrate + deploy → 8 Playwright e2e + PR. **Commit after each phase once
  its gate is green.**
- `package.json` scripts `typecheck` / `lint` (eslint) / `test` turn on `verify.sh`.

## ✅ RESOLVED 2026-06-27 — schema conflict + auth decision
**Decisions (user, 2026-06-27):**
1. **CONTRACT.md wins** the reconciliation. `0001_init` will **drop** the 4 partner tables (`projects`,
   `posts`, `social_connections`, `oauth_states`) and create the 13 CONTRACT tables. Partner
   `supabase/schema.sql` is superseded. (Live audit: only 3 disposable rows — 0 projects, 0 posts, 1
   social_connection, 2 oauth_states; **no migrations** in the ledger, tables were pasted raw.)
2. **GitHub auth IS in the demo.** Supabase Auth + GitHub OAuth provider, **per-user accounts**
   (`accounts.id = auth.uid()`, RLS **ON**, policy `account_id = auth.uid()`). The hardcoded Brew Lab
   literal `…00000b1e51ab` is **retired** (stale frontend scaffolding). CONTRACT.md §1a + EXECUTION_PLAN
   §0.5 "Auth deltas" hold the full model. `handle_new_user` trigger provisions the `accounts` row on
   first sign-in; onboarding upserts `brands`.

**Audit findings (read-only, via Supabase MCP — the MCP works despite `claude mcp list` showing
"Pending approval"):** live `public` schema = exactly the partner's 4 tables, all RLS-disabled (advisor
flagged critical, aligns with our intent to manage RLS ourselves). `auth.*` is stock Supabase Auth
(users=0). REST/JWT keys in `.env.local` still 401 (legacy JWT disabled) — use the **MCP** to read the DB,
not the keys. `.env.local` still has VITE_* names; needs NEXT_PUBLIC_* + GitHub OAuth wired in Supabase
dashboard (HUMAN PRECONDITION).

## Gotchas
- 4 channels only (Reddit, TikTok, Instagram, X). Video is founder-posted, never auto-published.
- Live demo runs from the deployed Vercel URL — engineer around serverless cold-start/timeout with a
  cached golden-payload fallback.
- Nothing built yet. Repo has docs only; app not scaffolded.

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
flagged critical, aligns with our intent to manage RLS ourselves). `auth.*` is stock Supabase Auth.
**Keys now WORK** (the earlier 401 is stale): publishable `sb_publishable_-23bRn…` and the legacy
`service_role` JWT both return HTTP 200. `.env.local` now carries the Next.js names
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable, `SUPABASE_SECRET_KEY` =
service_role). Partner confirmed GitHub OAuth is set up in the Supabase dashboard.

## Build position — Phases 0→2 GREEN, Phase 3 next (2026-06-27)
- Scaffold + mock frontend already live on this branch (`docs/phase-0-contract`): Next 16 App Router,
  7 routes, `lib/data.tsx` mock layer, `@anthropic-ai/sdk ^0.52.0` + `@supabase/supabase-js` declared.
- **Phase 0 DONE** (contract, amended for auth). **Phase 1 DONE** (`npm install`; sdk + key + MCP gate
  green — commit `629e385`). **Phase 2 DONE** (`./verify.sh` exits 0 — typecheck+lint+3 tests; `next build`
  prerenders all 7 routes).
- **Phase 3 (Schema + types + seed) DONE ✅.** `0001_init` (migration `20260627221415`): dropped the 4
  partner tables, created the 13 CONTRACT tables, `handle_new_user` trigger, RLS ON with showcase policies
  (own rows rw + `DEMO_ACCOUNT_ID …00000b1e51ab` read-only), `brand-assets` bucket. `seed.sql` loaded the
  Brew Lab showcase: **22 posts**, every table ≥1 row (post_metrics 42, founder_scripts 5, etc.).
  `accounts`=2 → trigger already fired for a real GitHub sign-in. Types regenerated to
  `lib/database.types.ts`; `typecheck` exits 0. Gate green. `0002_canva_oauth_states` codifies the Canva
  integration (below).
- **Phase 4 (Surfaces — live wiring) DONE ✅ (branch `feat/phase-4-live-wiring`).** Added `lib/api.ts`
  (typed mock→live seam over `lib/database.types.ts`, `USE_MOCK` defaults true, live reads filter to the
  Brew Lab **demo account** `…00000b1e51ab` which every authed user can read via the RLS read policy),
  `lib/queries.ts` (React Query hooks + approve/markFilmed mutations), `lib/types/content.ts` (`PostContent`
  union), `lib/supabase/admin.ts`. Swapped all 5 surfaces + drawer off direct `lib/data.tsx` imports onto
  the hooks (mock view-model preserved via `mapPostRow` adapter). Onboarding now lifts wizard state, has a
  **brand-doc upload (.md/.txt) → `/api/analyze`** (Claude Haiku strict tool → industry/recommended_channels/
  rationale, persisted to `brands` via admin upsert) that **pre-selects channels**, and **upserts the brand**
  on completion; `first-run-gate` now checks for a `brands` row (server truth) with a localStorage fast-path.
  Gate green: `./verify.sh` exits 0 (typecheck+lint+test, incl. new `__tests__/contract.test.ts` PostContent↔
  format_t parity), `npm run build` prerenders all 7 routes + `/api/analyze`, dev server boots clean.
  **Env (in `.env.local`, gitignored):** `NEXT_PUBLIC_USE_MOCK` + `NEXT_PUBLIC_DEMO_ACCOUNT_ID` added.
  Live reads (`USE_MOCK=false`) require an authenticated session (RLS policies are `authenticated`-role).
- **Phase 5 (AI Route Handlers) DONE ✅ (branch `feat/phase-5-ai-handlers`).** `/api/generate`
  (`claude-sonnet-4-6`, streamed via a strict `emit_posts` tool, 28s AbortController, **golden-payload
  fallback** on timeout/error/`x-force-fail`/truncation/too-few-posts) and `/api/chat-edit`
  (`claude-haiku-4-5`, compute-only validated patch, video 422-guarded, 20s timeout). Pure modules:
  `lib/ai/content-validation.ts` (CAPS + `validateFullContent`/`validateAndMergePatch`),
  `lib/generate-schema.ts` (`EMIT_POSTS_TOOL` + `validateAndCap`), `lib/golden-payload.ts`
  (`GOLDEN_PAYLOAD` + `reanchorGolden` + `CACHED_RESEARCH`). **Decisions (user):** writes go to the
  **signed-in user's own account**; `lib/api.ts` reads now **follow the user** (`resolveAccount`) with
  the Brew Lab demo account as empty-state fallback, and analytics falls back to the seeded showcase
  (per-account metrics are v1). Carousel SVG→PNG **deferred**. Inserts go through an atomic
  **`create_campaign_posts` RPC** (migrations `0003`/`0004` — regen-delete folded in, EXECUTE locked to
  service_role; SQL committed under `supabase/migrations/`). Frontend: onboarding LoadingStep streams real
  generate progress; the drawer renders live `post.content`; the chat launcher is the **wow moment** —
  post-scoped chat-edit → preview → Apply updates the drawer live. An **adversarial review workflow**
  caught + fixed 5 must-fix issues (calendar off-by-one, truncation→golden, atomic regen, golden
  re-anchor, loader leak) + XSS-escape/owner-scope/timeout hardening. Gate: `./verify.sh` 0 (typecheck +
  lint + **21 tests**), `next build` prerenders all routes + 3 dynamic `/api/*`, RPC + 401/400 auth-gating
  smoke-tested. **Live model path (streamed generate + chat-edit patch) needs a logged-in session to
  exercise end-to-end** — verify after GitHub/Google login.
- **Phase 6 (OAuth/publish mock + onboarding Connect) DONE ✅** and **Phase 7 (integration + deploy prep)
  DONE ✅ — branch `feat/phase-6-7-publish-deploy`, PR #11.** Two commits (one per phase). Built natively
  in the `lib/api.ts` seam (browser client, RLS own-row writes), NOT the partner's root `api/*.js`:
  `connectAccount`/`disconnectAccount`/`getSocialAccounts` (Connect → `social_accounts.status='mock'`,
  `write_scope` = the publishable set reddit/x/instagram per CONTRACT §1a), `publishPost` (mock publisher,
  full selector `status='scheduled' AND approval_state='approved' AND channel IN reddit/x/instagram` →
  `status='published'` + synthetic `external_post_id`; video never publishes), `publishApproved` (approve-all
  companion, publishes each candidate via `publishPost` for unique ids), `markFilmedByPost` (drawer mark-filmed
  by `post_id`). Wired: onboarding Connect (optimistic, reverts on error), Settings real status + Disconnect,
  drawer Approve → "Published to {Channel} ✓" + Mark-filmed mutates, calendar Approve-all count toast.
  Phase 7: **removed 3 redundant root funcs** (`connect-social`/`mock-post`/`post-social`; Canva funcs kept),
  guarded PostHog (`lib/analytics.ts`, no-op without `NEXT_PUBLIC_POSTHOG_KEY`) + 3 events
  (`onboarding_completed`/`campaign_generated`/`post_approved`), `.env.example` documents
  `USE_MOCK`/`DEMO_ACCOUNT_ID`/`POSTHOG_*`. An **adversarial multi-agent review** caught + fixed 4 real issues
  (write_scope/PUBLISHABLE reconciliation, missing `status='scheduled'` guard, bulk `external_post_id`
  collision, optimistic-connect rollback). Gate: `./verify.sh` 0 (typecheck+lint+21 tests), `next build`
  prerenders. **Vercel preview READY** (PR #11); prod `/api/generate` → 401 (route deployed, self-gates).
  **Still to verify in-browser after GitHub login:** live publish/Connect writes + the forced-failure golden
  fallback (the `/api/*` 401 gate + preview deployment-protection block unauth curls). **Deploy = live**
  (`NEXT_PUBLIC_USE_MOCK=false`) needs the GitHub OAuth provider configured in Supabase.
- **Next: Phase 8 — Playwright e2e** against the deployed URL (9-step demo path, 3× pass) + the standing
  forced-failure golden-fallback curl.

## ✅ RESOLVED — Canva un-deferred (2026-06-27)
The partner added Canva to the **shared** DB mid-session (out-of-band: `canva` in `provider_t` + an
`account_id`-keyed `oauth_states` PKCE table). **Decision: Canva is IN.** Codified + RLS-secured in
migration `0002_canva_oauth_states` (own-account policy on `oauth_states`). Canva is an **asset/OAuth
integration, NOT a 5th publishing channel** — the 4-channel publish rule (Reddit/TikTok/Instagram/X)
stands. The Canva **render approach** (Canva MCP vs Connect REST, §6d) is still the partner's call —
coordinate before wiring the slideshow render. **Process note:** the partner edits the shared DB
out-of-band (no tracked migrations); expect drift and re-check `list_tables`/enums before schema work.

## Gotchas
- 4 channels only (Reddit, TikTok, Instagram, X). Video is founder-posted, never auto-published.
- Live demo runs from the deployed Vercel URL — engineer around serverless cold-start/timeout with a
  cached golden-payload fallback.
- Frontend is currently all **mock** (`lib/data.tsx`); live Supabase wiring (`lib/api.ts` + clients) is
  Phase 3/4 work. No live `lib/api.ts` or Supabase client exists yet.

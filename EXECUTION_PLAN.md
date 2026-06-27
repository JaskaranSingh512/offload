# Offload — Execution Plan (autonomous build runbook)

Start-to-finish runbook to build **Offload** (marketing autopilot for solo founders — see `PRD.md`).
This document is written **for Claude Code (an autonomous coding agent) to execute**, not for a human
team. There is no half-day scheduling and no person-A/B/C split. Instead each phase is an ordered list
of concrete steps with **exact shell commands** (non-interactive flags, no prompts), **exact file
paths**, **what content to put where**, and a **Verification gate** — the precise command to run and the
pass condition — that must succeed before the next phase begins.

The agent runs with all permissions allowed (bypassPermissions) and may freely use: Supabase MCP, the
Anthropic SDK, `git`, `gh`, `npm`, the `vercel` CLI, and the PostHog MCP.

> **The single most important rule:** freeze the data contract (Phase 0) **before** generating any TSX
> component or SQL. The schema, the typed data layer (`src/lib/api.ts`), the Route Handlers, and the
> seed must all agree on table names, the tenant key, and the post-status model. Fix it once, up front,
> and every other phase composes. The contract is now also the source for **generated TypeScript types**
> (`src/types/database.types.ts`), but the table/column/status model below is **unchanged**.

> **Workflow guard (from CLAUDE.md):** never commit to `main`. Create a feature branch first
> (`git checkout -b feat/scaffold-nextjs`), push, and open a PR with `gh`. Do all of Phases 0→8 on that
> branch.

---

## 0.5 Active scope — 12-Hour MVP, integrated (READ FIRST; amends the phases below)

We are building the **12-Hour MVP** (`MVP_12H.md`) **on these EXECUTION_PLAN Next.js + Supabase + phased
rails**. This section is the **active scope**: where it conflicts with a phase below, **this wins**.
Phases 0→8 and their Verification gates still apply — what follows are the deltas, plus the per-phase
**done = gate passes** + **commit-per-phase** rules from CLAUDE.md.

**Locked decisions (2026-06-27):**
- **Stack:** Next.js (App Router) + Route Handlers + Supabase — **not** Vite/Express. Keep §3 scaffold as-is.
- **Channels:** build **all 4** (Reddit, TikTok, Instagram, X). NEW: onboarding uploads a brand doc and
  the AI **recommends which channel(s) to lead with** (e.g. fitness app → Instagram/TikTok; B2B/professional
  → X/Reddit) with a one-paragraph rationale. The recommendation **pre-selects** channels; it does not
  restrict — the founder can still run all 4. The "4 channels only" constraint is intact.
- **Doc upload:** `.md` / `.txt` only for v1 — no PDF parsing. Extract text, store it on the brand.
- **Canva slideshow render:** **DECISION DEFERRED.** When we build slide rendering (the §6d IG-carousel /
  slideshow step), **stop and ask: Canva MCP vs Canva Connect REST.** Until then keep the satori→PNG path
  as the placeholder renderer.
- **GitHub auth:** MVP_12H wants real GitHub login; this plan's demo currently runs **no-auth** (§0).
  **OPEN — confirm before Phase 4** whether to add Supabase GitHub OAuth or keep the hardcoded `account_id`.

**New feature folded in — "brand doc → channel strategy":**
- **Data (Phase 0 + 3):** extend the `brands` table with `doc_name text`, `doc_text text`, `industry text`,
  `recommended_channels text[]`, `channel_rationale text`. **No new table** — the MVP's `projects` collapses
  into the existing account-scoped `brands` row. Reflect these columns in `CONTRACT.md` (Phase 0 gate) and
  the migration (Phase 3, §4a).
- **Surface (Phase 4):** onboarding gains an **Upload brand doc** step before the channel toggles; after
  upload it shows the AI suggestion ("We'd lead on **Instagram + TikTok** because …") with the recommended
  channels pre-toggled.
- **AI (Phase 5):** new Route Handler **`/api/analyze`** — Claude reads `doc_text` and returns
  `{ industry, recommended_channels[], channel_rationale }` via a strict tool; persists to the brand row.
  It sits alongside `/api/generate` + `/api/chat-edit` (same model-tiering rules, §6a).
- **Demo path (§9):** step 1 (onboarding) now includes **doc upload → AI channel recommendation** before
  the live "Generate."

**Unchanged by the MVP:** the two-column post-status model, 4-channel campaign generation, founder-posted
video (never auto-published), all mock publishing, the golden-payload fallback, and every Verification gate.

---

## Preconditions — human-provided inputs (the agent assumes these exist)

The agent is handed the following before it starts and assumes each is already set in the environment
(`.env.local` + the shell). It does **not** try to create accounts or provision billing — those are
**HUMAN PRECONDITIONS** (no CLI exists). Where a CLI does exist, the exact command is given inline below.

| Secret / value | Env var | How obtained |
|---|---|---|
| Supabase project URL | `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL` | **HUMAN PRECONDITION** — create project at supabase.com |
| Supabase publishable (anon) key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from the Supabase project (`sb_publishable_…`) |
| Supabase secret / service_role key | `SUPABASE_SECRET_KEY` | from the Supabase project (`sb_secret_…`, server-only) |
| Supabase project ref / id | `SUPABASE_PROJECT_ID` | from the Supabase project settings |
| Supabase personal access token | `SUPABASE_ACCESS_TOKEN` | **HUMAN PRECONDITION** — supabase.com → Account → Access Tokens |
| Anthropic API key | `ANTHROPIC_API_KEY` | **HUMAN PRECONDITION** — console.anthropic.com key + **billing** |
| Vercel token | `VERCEL_TOKEN` | **HUMAN PRECONDITION** — vercel.com → Account → Tokens; the **initial Vercel project link** is also a human precondition |
| PostHog project key + host | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | from the PostHog project (already connected, project `363064`) |
| Brew Lab demo tenant id (hardcoded literal) | `NEXT_PUBLIC_ACCOUNT_ID` | use the literal UUID `00000000-0000-0000-0000-00000b1e51ab` (see §3c/§4d) |

If any **HUMAN PRECONDITION** is missing, stop and ask for it — do not attempt to self-provision.

---

## 0. Shape of the build (architecture)

**Two deployable pieces on Vercel + Supabase — no separate Node/Express service.** The old "ONE Express
process" is gone; the AI endpoints are now **Next.js App Router Route Handlers** that run server-side on
Vercel and hold the secret keys.

| Piece | Tech | Role |
|---|---|---|
| **Next.js app** (UI) | Next.js 16 (App Router) + TypeScript + Tailwind v4 + **shadcn/ui**, Server/Client Components, `@tanstack/react-query` v5 for client data, `zustand` for UI/overlay state, Recharts (via shadcn `chart`) | The 5 surfaces + onboarding + chat + drawer. Server Components by default; `'use client'` only where hooks/events/interactive shadcn are used. |
| **Next.js app** (API) | App Router **Route Handlers** at `src/app/api/*/route.ts`, `runtime='nodejs'` | `/api/generate` (streamed Sonnet), `/api/chat-edit` (Haiku). Holds `ANTHROPIC_API_KEY` + Supabase secret key. Server-only secrets. |
| **Backend** | **Supabase** (Postgres + Storage) | All data + brand-asset files. |

Both Next.js pieces deploy as **one Vercel project** (the UI is statically/SSR served; the Route
Handlers become Vercel Functions). **The live demo runs from the deployed Vercel URL, not localhost** —
so serverless cold-start/timeout on the live "Generate" is a real risk, engineered around in §5 and §10.

**Backend execution model.** No pgmq/pg_cron/Edge-Function/worker fan-out for the demo. The browser
calls Route Handlers via `fetch`; Route Handlers talk to Anthropic + Supabase. The
queue/cron/worker design is the documented **v1** path, not the demo path.

**Auth for the demo = none.** Skip Supabase Auth + RLS for the build: one hardcoded `account_id`, RLS
disabled (or fully permissive), the browser on the **publishable/anon** key. This removes an entire
class of "why is my query empty" bugs. Real magic-link Auth + per-table RLS (`account_id = auth.uid()`)
is a **v1** add. Onboarding still **persists the brand to a Supabase `brands` row** (not localStorage) so
the Route Handler can read it server-side.

**Secrets never touch the browser.** `ANTHROPIC_API_KEY`, any image-gen key, and the Supabase
**secret/`service_role`** key are read only inside Route Handlers via `process.env.X` (unprefixed,
server-only). The client bundle gets only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(publishable). **Never** prefix a secret with `NEXT_PUBLIC_` — that inlines it into the client bundle.

---

## 1. Phase 0 — Freeze the contract (do this FIRST, blocks everything)

Write **one** canonical doc, `CONTRACT.md` at repo root, that the SQL migration, the generated TS types,
`src/lib/api.ts`, the Route Handlers, and the seed all conform to. It pins four things. **Generated
TypeScript types (`src/types/database.types.ts`) are produced FROM this schema (Phase 3) and imported as
the `Database` generic everywhere** — but the table/column/status model here is the authority and is
unchanged from the original plan.

### 1a. Tables, tenant key, status model
- **Tenant key is `account_id`** everywhere (one account = one founder = one brand in v1).
- **Plural table names**: `accounts, brands, brand_assets, social_accounts, campaigns, posts,
  founder_scripts, post_metrics, tracked_links, conversions, suggestions, notifications,
  cross_account_aggregates`.
- **Post state is two columns** (the part everyone gets wrong):
  - `posts.status` ∈ `draft | scheduled | published | needs_attention | stalled`
  - `posts.approval_state` ∈ `pending | approved | rejected`
  - The PRD's "**scheduled (pending approval)**" = `status='scheduled'` + `approval_state='pending'`.
  - **Approve** sets `approval_state='approved'` (NOT `status='scheduled'`).
  - The (mock) publisher selects `status='scheduled' AND approval_state='approved' AND
    scheduled_at<=now() AND channel IN ('reddit','x','instagram')`.
- `posts` orders by **`scheduled_at`** (not `schedule`). `src/lib/api.ts` must use plural tables + these
  exact column names. With generated types, a wrong column name is now a **compile error** — lean on it.

### 1b. Content shapes — **five `posts.content` shapes + the `founder_scripts` shape**
```jsonc
// posts.content (five JSONB shapes, keyed on posts.format):
reddit_text  | x_post  : { "title": "...", "body": "..." }
x_thread              : { "tweets": ["...", "..."] }
ig_carousel           : { "slides": [{"heading":"...","sub":"..."}], "caption":"..." }  // text layer only
ig_single             : { "caption":"...", "image_prompt":"...", "image_path":"brand-assets/<acct>/generated/..." }
tiktok_script         : { "hook":"...", "scenes":["..."], "shot_note":"...", "duration_sec":30 }
// the founder_scripts row shape (one per VIDEO post — see §1d):
founder_scripts row    : { angle, hook, beats[], shot_note, duration_sec, filmed }
```
**Both video formats (`tiktok_script` and `founder_script`) get a `founder_scripts` row** so either can be
marked filmed (see §1d/§4a/§5a/§6b). For `founder_script` posts, `posts.content` may be `{}` — the script
lives entirely in the `founder_scripts` row; for `tiktok_script`, `posts.content` holds the scene shape
above **and** a sibling `founder_scripts` row tracks `filmed`.
Define a discriminated-union TS type `PostContent` (keyed on `format`, the five `posts.content` shapes) in
`src/types/content.ts` so the
drawer and the chat-edit patch are both type-checked against these shapes. The `/api/chat-edit` endpoint
returns a **patch over this same shape**, so "apply" goes through the exact same React Query mutation the
drawer uses.

### 1c. Define the three undefined PRD terms (blocks Analytics + Approve-all)
- **forecast** = `frequency × duration × per-channel best-time impression heuristic`, stored on
  `campaigns.forecast` jsonb `{impressions, signups}`. It's the Dashboard "forecast vs actual" baseline.
- **engagement_rate** = `engagements / impressions` (per post; aggregate by sum/sum).
- **"Approve all"** scope = posts with `status='scheduled' AND approval_state='pending'` **in the current
  calendar channel filter**. Scoping to `status='scheduled'` ensures Approve-all can never sweep
  founder-posted video drafts (which sit at `status='draft'` until filmed — see §1d/C7).

### 1d. Video content model (PRD open question #11)
- `founder_script` (talking-head) = the **Founder Scripts surface** (`founder-scripts.tsx`) content.
- `tiktok_script` (scene-by-scene) = the **TikTok channel's** content.
- **Every video post of either format has its own `founder_scripts` row** carrying `filmed`. Both gate
  calendar activation on `filmed=true`, **neither** enters the publish query — the founder posts video
  manually. Offload tracks `filmed` only. `getScripts`/`markFilmed` are scoped to both formats (join
  `posts.format IN ('tiktok_script','founder_script')`), so both can be marked filmed. (Forced by API
  reality — see §6.)

**Verification gate (Phase 0):** `test -f CONTRACT.md && grep -q "approval_state" CONTRACT.md && grep -q
"account_id" CONTRACT.md` exits 0, and the doc contains the 13-table list, both status enums, the **five
`posts.content` shapes + the `founder_scripts` shape**, and the three term definitions. Do not write SQL
or TSX until this passes.

---

## 2. MCP & external service setup (do-this-first checklist)

Legend: 🟢 build real · 🟡 real if time, else mock · 🔴 mock/skip for demo.

| # | Item | Priority | Real? | Credentials |
|---|------|----------|-------|-------------|
| 1 | **Supabase hosted project** | P0 | 🟢 | account, DB pw, project ref, publishable + secret keys |
| 2 | **Supabase MCP server** (hosted remote) | P0 | 🟢 | Supabase OAuth **or** PAT + project ref |
| 3 | **Anthropic API key** (metered, separate from the Claude Code sub) | P0 | 🟢 | console.anthropic.com key + billing |
| 4 | **Next.js app scaffold** (UI + Route Handlers) | P0 | 🟢 | — |
| 5 | **Vercel project** (git-connected, env vars) | P0 | 🟢 | Vercel account; optional `VERCEL_TOKEN` for CI |
| 6 | Image-gen API (IG single-image) | P2 | 🔴→🟡 | one provider key (Imagen / GPT-Image / fal.ai) |
| 7 | Web-search / research (§7.1) | P2 | 🔴→🟡 | none (Anthropic native `web_search`) / Tavily/Exa/Brave |
| 8 | **PostHog** product analytics | P1 (already connected) | 🟢 | PostHog project key for `posthog-js` (project `363064`) |
| 9 | Gmail MCP (§9 email notifs) | P3 | 🔴 | claude.ai connector OAuth |
| 10 | Google Calendar MCP | P3 | 🔴 | claude.ai connector OAuth |

**The big rocks are #1–#5.** Mock everything else and the demo still holds; without #1–#5 there is no app.

### Key setup details
- **Supabase project**: create at supabase.com → grab `URL`, **publishable** key (`sb_publishable_…`, the
  2026 format; `NEXT_PUBLIC_SUPABASE_ANON_KEY` legacy JWT still works), and **secret** key
  (`sb_secret_…`, server-only). Note: a `sb_secret_…` key sent from a browser is rejected at the gateway
  — that's the guardrail working; keep it in Route Handlers only.
- **Supabase MCP** (hosted remote, verified June 2026). **PRIMARY = non-interactive PAT** (no browser):
  ```bash
  # Requires SUPABASE_ACCESS_TOKEN in env (see Preconditions). <REF> = SUPABASE_PROJECT_ID.
  claude mcp add --scope project --transport http \
    supabase "https://mcp.supabase.com/mcp?project_ref=<REF>" \
    --header "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
  ```
  Human fallback only (interactive, needs a browser — do NOT use in the autonomous run):
  `claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<REF>"`
  then `/mcp → Authenticate` (browser OAuth).
  Use the MCP `apply_migration` tool for tracked DDL and `execute_sql` for ad-hoc/seed queries.
  **Verify the exact tool names at build time** by probing the live server — call `list_tables` (or
  enumerate via `ListMcpResourcesTool`) and confirm `apply_migration`, `execute_sql`, `list_tables`,
  `list_migrations` are present; the hosted tool surface drifts. **Fallback** if a tool name differs:
  author SQL in `supabase/migrations/` and `npx supabase db push` to the linked remote.
- **Anthropic key**: `npm i @anthropic-ai/sdk`. Key is **metered, separate from the Claude Code
  subscription**; a full demo's generation costs cents. **Verify model IDs at build time** via the
  `claude-api` skill (`claude-opus-4-8` seed / `claude-sonnet-4-6` live generate / `claude-haiku-4-5`
  chat-edit; web-search tool `web_search_20260209`); fall back to the nearest current IDs the skill
  reports if any string has changed.
- **Vercel** (`VERCEL_TOKEN` is **MANDATORY on every `vercel` call** — keeps CI non-interactive). The
  initial project link is a HUMAN PRECONDITION; thereafter:
  `vercel link --yes --token $VERCEL_TOKEN`, `vercel pull --yes --token $VERCEL_TOKEN`,
  `vercel deploy --prod --yes --token $VERCEL_TOKEN`. Pushing the branch to the git-connected repo also
  triggers an auto-build of the production URL.
- **PostHog** (already connected, project `363064`): use for **Offload's own** funnel
  (`onboarding_completed`, `campaign_generated`, `post_approved`) via `posthog-js`. Keep the
  founder-facing campaign analytics in **Supabase `post_metrics`** (seeded) — don't mix the two.

**Verification gate (Phase 1):** `claude mcp list` shows `supabase` connected; `node -e
"require('@anthropic-ai/sdk')"` succeeds after install; a one-line MCP `list_tables` call returns
(an empty list is fine — it proves auth). Confirm `ANTHROPIC_API_KEY` is set in the local `.env.local`
and (later) in Vercel. Do not proceed to schema until the MCP answers.

---

## 3. Scaffold the Next.js app + Supabase data layer

### 3a. Scaffold (non-interactive — no prompts, non-empty repo)
The repo already holds docs (`PRD.md`, `CLAUDE.md`, …) so `create-next-app` will refuse the root.
Scaffold into a temp subdir, then `rsync` everything (including dotfiles) up and delete the temp dir.
`--yes` guarantees no prompts; `--src-dir` is **required** (not a default) for the `src/` layout this plan
assumes; `--no-agents-md` stops Next 16 from emitting `AGENTS.md` + `CLAUDE.md` (which would clobber the
project's existing `CLAUDE.md`). Verify flag spelling against `create-next-app --help` at build time, but
these are correct as of June 2026 (Next 16, Tailwind v4, Turbopack default), and requires **Node ≥ 20.9**
(check `node -v` first):
```bash
npx create-next-app@latest offload-app \
  --ts --tailwind --eslint --app \
  --src-dir --import-alias "@/*" \
  --turbopack --use-npm --no-agents-md --yes
# move generated files (incl. dotfiles) into the repo root, then remove the temp dir:
rsync -a --exclude .git offload-app/ ./
rm -rf offload-app
```
If `--no-agents-md` is unavailable on the installed CLI, instead delete the generated `AGENTS.md` and
**do not** overwrite the existing `CLAUDE.md` (`rsync --exclude CLAUDE.md --exclude AGENTS.md ...`). The
existing `PRD.md`/`CLAUDE.md`/`NOTES.md`/`EXECUTION_PLAN.md`/`CONTRACT.md`/`verify.sh` must survive.

Then add libraries (note `satori` + `@resvg/resvg-js` for the IG-carousel SVG→PNG render in §6d, and the
Supabase CLI as a devDep so `gen types`/`db push` work without a global install):
```bash
npm install @supabase/ssr @supabase/supabase-js @tanstack/react-query zustand @anthropic-ai/sdk posthog-js
npm install satori @resvg/resvg-js
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react supabase
```
`satori` needs an **explicit font buffer** passed in `fonts: [{ name, data, weight, style }]` — load a
`.ttf`/`.otf` from `src/lib/fonts/` (it has no system-font access in the Route Handler).

### 3b. shadcn/ui (package is `shadcn`; `shadcn-ui` is deprecated — do not use it)
```bash
npx shadcn@latest init --defaults --yes
# NOTE: shadcn removed `toast`; use `sonner` (the replacement) for the mock-publish confirmation.
npx shadcn@latest add button card sheet dialog tabs table calendar chart badge input textarea \
  label switch select dropdown-menu sonner skeleton separator --yes
```
Component → Offload surface map:
- Dashboard KPI cards → **card** + **badge** (status pills)
- 2-week campaign grid → hand-built with **card** + CSS grid (the shadcn `calendar` is a date-picker
  primitive, not a scheduling grid; use it only if a date input is needed)
- Slide-over Content Detail drawer → **sheet**
- Modal confirmations → **dialog**
- Channel/section switching → **tabs**
- Content/schedule lists, format-performance table → **table**
- Analytics "what worked" charts → **chart** (Recharts-based: `ChartContainer`/`ChartTooltip`)
- Toasts (mock-publish confirmation) → **sonner**: render `<Toaster/>` once in `layout.tsx`, then call
  `toast("Published to X ✓")` from the mock-publish path (`import { toast } from "sonner"`)

### 3c. Env files
Create `.env.local` (gitignored — confirm `.gitignore` has `.env*.local`). The Brew Lab tenant id is a
**hardcoded literal UUID used verbatim here AND in the seed (§4d)** — no placeholder:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_PROJECT_ID=...                     # used by `gen types` + `db push`
SUPABASE_ACCESS_TOKEN=sbp_...               # read by the Supabase CLI from env (gen types / db push / MCP)
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ACCOUNT_ID=00000000-0000-0000-0000-00000b1e51ab   # Brew Lab demo tenant (literal)
NEXT_PUBLIC_USE_MOCK=true                    # mock→live seam (§5a); flip to false for live reads
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
Mirror the same vars into Vercel **non-interactively** (`vercel env add` is interactive otherwise — pipe
the value and pass the token):
```bash
printf '%s' "$VAL" | vercel env add NAME production --token $VERCEL_TOKEN   # repeat per var, per env
```
**`SUPABASE_SECRET_KEY` and `ANTHROPIC_API_KEY` are unprefixed** → never reach the browser.

### 3d. Supabase clients (`@supabase/ssr`; old `auth-helpers-nextjs` is deprecated)
- `src/lib/supabase/client.ts` — `createBrowserClient<Database>(url, anonKey)` for Client Components.
- `src/lib/supabase/server.ts` — `createServerClient<Database>(url, anonKey, { cookies })` wired to
  `next/headers` for Server Components/Route Handlers that act as the user.
- `src/lib/supabase/admin.ts` — **server-only** service client: `createClient<Database>(url,
  process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } })`. Import this **only** in Route
  Handlers. (No cookie machinery needed for a bare secret-role client.) Because the demo has RLS off, the
  browser anon client can read/write directly; the admin client is for server writes that must bypass RLS.

### 3e. `package.json` scripts so `./verify.sh` lights up
Add these scripts. **`next lint` was REMOVED in Next.js 16** — use the eslint invocation
`create-next-app` actually scaffolds (`eslint .`). `update-types` uses `npx supabase` (the CLI is a
devDep, not global) and reads `SUPABASE_ACCESS_TOKEN` from env:
```jsonc
"typecheck":    "tsc --noEmit",
"lint":         "eslint .",
"test":         "vitest run",
"update-types": "npx supabase gen types typescript --project-id \"$SUPABASE_PROJECT_ID\" --schema public > src/types/database.types.ts"
```
Add a minimal `vitest.config.ts` (jsdom env, React plugin) and one smoke test
(`src/lib/__tests__/contract.test.ts`) that asserts the format enum list and the two status enums match
§1 — so `test` does something real from day one. `./verify.sh` runs `npm run lint` (eslint-based).

**Verification gate (Phase 2):** `npm run build` succeeds (Turbopack production build), `npm run
typecheck` exits 0, `npm run lint` exits 0 (eslint), `npm run dev` serves `/` without runtime error, and
`npx shadcn@latest add button --yes` is idempotent (component already present). `./verify.sh` runs all
three scripts and exits 0.

---

## 4. Supabase schema, types, storage, seed

### 4a. DDL (apply via MCP `apply_migration`, name it `0001_init`)
Same model as the frozen contract — single `social_accounts`, `account_id` tenant key, plaintext tokens
for the demo.
```sql
create type voice_t       as enum ('warm_witty','authoritative','playful','editorial');
create type goal_t        as enum ('awareness','orders','community','launch');
create type provider_t    as enum ('reddit','x','instagram','tiktok');
create type freq_t        as enum ('light','balanced','aggressive');
create type camp_status_t as enum ('draft','generating','active','completed');
create type format_t      as enum ('reddit_text','x_post','x_thread','ig_carousel',
                                   'ig_single','tiktok_script','founder_script');
create type post_status_t as enum ('draft','scheduled','published','needs_attention','stalled');
create type approval_t    as enum ('pending','approved','rejected');
create type sa_status_t   as enum ('connected','read_only','expired','disconnected','mock');

create table accounts ( id uuid primary key default gen_random_uuid(), email text, created_at timestamptz default now() );

create table brands (
  account_id uuid primary key references accounts(id) on delete cascade,
  name text, one_liner text, domain text, colors jsonb default '{}',
  voice voice_t default 'warm_witty', audience text, goal goal_t default 'awareness' );

-- account-scoped brand assets (logo/font/sample refs). SEPARATE from the `brand-assets` Storage
-- bucket (§4b) — this table is the 13th frozen table (§1a) and metadata only.
create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  kind text check (kind in ('logo','font','color','sample','other')),
  label text, storage_path text, meta jsonb default '{}',
  created_at timestamptz default now() );

create table social_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  provider provider_t not null, handle text,
  read_scope boolean default false, write_scope boolean default false,
  oauth_access_token text, oauth_refresh_token text, token_expires_at timestamptz,  -- v1: Supabase Vault
  status sa_status_t default 'disconnected',
  unique (account_id, provider) );

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  name text not null, goal goal_t not null, duration_days int not null,
  frequency freq_t default 'balanced', channels text[] default '{}',
  status camp_status_t default 'draft', starts_on date, ends_on date,
  forecast jsonb default '{}', created_at timestamptz default now() );

create table posts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  channel provider_t not null, format format_t not null,
  status post_status_t default 'draft', approval_state approval_t default 'pending',
  scheduled_at timestamptz, published_at timestamptz,
  rationale text, content jsonb not null default '{}', external_post_id text,
  created_at timestamptz default now() );
create index on posts (account_id, scheduled_at);
create index on posts (status, approval_state, scheduled_at);

create table founder_scripts (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  angle text, title text, hook text, beats jsonb default '[]',
  shot_note text, duration_sec int, filmed boolean default false );

create table post_metrics (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  post_id uuid not null references posts(id) on delete cascade,
  impressions int default 0, engagements int default 0,
  engagement_rate numeric default 0, followers_delta int default 0,
  captured_at timestamptz default now() );
create index on post_metrics (account_id, captured_at);

create table tracked_links ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), post_id uuid references posts(id),
  slug text unique, destination_url text, utm jsonb default '{}', click_count int default 0 );
create table conversions ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), tracked_link_id uuid references tracked_links(id),
  post_id uuid references posts(id), kind text check (kind in ('signup','order')),
  value numeric default 0, source text check (source in ('utm','snippet','platform','self_report')),
  occurred_at timestamptz default now() );
-- plus suggestions, notifications (account-scoped) and cross_account_aggregates (global, seeded)
create table suggestions ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), kind text, body text, payload jsonb default '{}',
  dismissed boolean default false, created_at timestamptz default now() );
create table notifications ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), kind text, body text, read boolean default false,
  created_at timestamptz default now() );
create table cross_account_aggregates ( id uuid primary key default gen_random_uuid(),
  industry text, audience_type text, goal goal_t, format format_t,
  metric text, value numeric, sample_size int );
```
Then disable RLS for the demo — **explicitly for every one of the 13 frozen tables** (no ellipsis):
```sql
alter table accounts                 disable row level security;
alter table brands                   disable row level security;
alter table brand_assets             disable row level security;
alter table social_accounts          disable row level security;
alter table campaigns                disable row level security;
alter table posts                    disable row level security;
alter table founder_scripts          disable row level security;
alter table post_metrics             disable row level security;
alter table tracked_links            disable row level security;
alter table conversions              disable row level security;
alter table suggestions              disable row level security;
alter table notifications            disable row level security;
alter table cross_account_aggregates disable row level security;
```

### 4b. Storage
One bucket `brand-assets`; generated images go to `brand-assets/<account_id>/generated/`. Create via MCP
`execute_sql` (`insert into storage.buckets ...`) or the Supabase dashboard. Do **not** introduce a
second bucket.

### 4c. Generate TypeScript types (now part of the build)
```bash
npm run update-types   # → src/types/database.types.ts
```
Wire the `Database` generic into all three Supabase clients (§3d). After this, `src/lib/api.ts` is fully
typed end-to-end — wrong table/column names fail `tsc`.

### 4d. Seed (the demo's safety net)
Apply `supabase/seed.sql` (or MCP `execute_sql`) creating a full **Brew Lab** account: brand row, a
2-week campaign, ~20–35 posts across all 4 channels, one `founder_scripts` row **per video post (both
`tiktok_script` and `founder_script` formats)**, a believable 7-day `post_metrics` curve, a few
`conversions`, `suggestions`, and a small `cross_account_aggregates`. **Pin these literal UUIDs and use
them verbatim in every gate/curl/SQL below:**
- account id = `NEXT_PUBLIC_ACCOUNT_ID` = `00000000-0000-0000-0000-00000b1e51ab`
- seed campaign id = `00000000-0000-0000-0000-0000ca33a191`
- a known seed post id (a Reddit/X text post, for the chat-edit demo) = `00000000-0000-0000-0000-0000905709a1`

The seed **must `insert into brand_assets`** too (so all 13 tables are populated). **The seed is the
safety net — the app renders fully even if a live call fails.**

**Verification gate (Phase 3):** MCP `list_tables` returns all **13** tables; for **every** table, an
anon-client read returns ≥ 1 row (proves browser-key + RLS-off works on each):
`select count(*) from <table> where account_id='00000000-0000-0000-0000-00000b1e51ab'` ≥ 1 (the two
global tables `cross_account_aggregates` and any unscoped read ≥ 1 without the filter);
`select count(*) from posts where account_id='00000000-0000-0000-0000-00000b1e51ab'` returns ≥ 20;
`npm run update-types` regenerates non-empty `src/types/database.types.ts`; `npm run typecheck` exits 0
with the `Database` generic wired in.

---

## 5. Frontend surfaces + the typed data layer

**Build directly in Next.js + TypeScript + shadcn.** There is **no throwaway JSX prototype** — PRD §5
(surfaces) and §6 (interactions) are the canonical design/copy source. Author TSX components, not
`src/*.jsx`.

### 5a. The mock→live seam — one typed module everything imports
`src/lib/api.ts` (never import `supabase` or mock data directly from components):
```ts
// columns MUST match the §1 contract; types come from src/types/database.types.ts
import type { Database } from "@/types/database.types";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const ACCT = process.env.NEXT_PUBLIC_ACCOUNT_ID!;
export const api = {
  // live "Generate" REUSES the seeded campaign_id, so there is exactly one campaign row → order-by
  // created_at limit 1 keeps `.single()` safe even before/after a regenerate (C9).
  getCampaign: () => USE_MOCK ? mock.campaign
    : sb.from("campaigns").select("*, posts(*)").order("created_at", { ascending: true }).limit(1).single(),
  getPosts:    () => USE_MOCK ? mock.posts    : sb.from("posts").select("*").order("scheduled_at"),
  // scripts for BOTH video formats — join posts so the grid shows tiktok_script + founder_script (C2).
  getScripts:  () => USE_MOCK ? mock.scripts
    : sb.from("founder_scripts").select("*, posts!inner(format)")
        .in("posts.format", ["tiktok_script","founder_script"]),
  getMetrics:  () => USE_MOCK ? mock.metrics  : sb.from("post_metrics").select("*"),
  approvePost: (id: string) => sb.from("posts").update({ approval_state: "approved" }).eq("id", id),
  // "Approve all" scoped so it can NEVER sweep founder-posted video drafts (C7).
  approveAll:  (channel: string) => sb.from("posts").update({ approval_state: "approved" })
        .eq("account_id", ACCT).eq("channel", channel)
        .eq("status", "scheduled").eq("approval_state", "pending"),
  // Mark filmed flips the founder_scripts flag AND the post status draft→scheduled so the calendar
  // placeholder activates (C5). Takes both ids; scoped to video posts via the founder_scripts row (C2).
  markFilmed:  async (scriptId: string, postId: string) => {
    await sb.from("founder_scripts").update({ filmed: true }).eq("id", scriptId);
    return sb.from("posts").update({ status: "scheduled" }).eq("id", postId).eq("status", "draft");
  },
  generate:    (brief: Brief) => fetch("/api/generate", { method:"POST", body: JSON.stringify(brief) }),
  chatEdit:    (msg: string, postId: string) => fetch("/api/chat-edit", { method:"POST", body: ... }),
};
```
Note the AI calls now hit **relative `/api/*` Route Handlers** (same origin) — no separate service URL,
no CORS. Wrap each read in a `@tanstack/react-query` hook for loading/error/empty states. **Swap mock→live
per entity** by flipping `NEXT_PUBLIC_USE_MOCK`. Generate→Calendar transition = awaited `fetch` +
`queryClient.invalidateQueries` (no Supabase Realtime — unneeded ceremony).

`src/lib/mock.ts` carries the Brew Lab mock, byte-aligned to the §1 contract and the generated row types.

**Onboarding brand write uses upsert.** `brands.account_id` is the PRIMARY KEY and the seed already
inserts a Brew Lab `brands` row for `NEXT_PUBLIC_ACCOUNT_ID`, so a plain insert would conflict. Write the
onboarding brand with `sb.from("brands").upsert(row, { onConflict: "account_id" })`.

### 5b. Component/surface tree (Server Components by default; `'use client'` where noted)
App Router file layout under `src/app/`:
```
src/app/
  layout.tsx                      Root: <Providers> (React Query + Zustand + PostHog), shell
  page.tsx                        Dashboard (redirect to /onboarding on first run)
  onboarding/page.tsx             5-step onboarding ('use client' — wizard state)
  calendar/page.tsx               2-week grid + channel chips + Approve all
  build/page.tsx                  Campaign Builder (reads ?prefill= from Analytics recs)
  scripts/page.tsx                Founder Scripts grid + Mark filmed
  analytics/page.tsx              In-flight + Recap modes
  api/generate/route.ts           Route Handler — streamed Sonnet (see §6)
  api/chat-edit/route.ts          Route Handler — Haiku single-post patch
src/components/
  shell/sidebar.tsx               Nav ('use client' for active route)
  shell/chat-launcher.tsx         Bottom-right floating launcher ('use client'), persists across routes
  drawer/content-detail.tsx       Sheet-based drawer ('use client'), format-aware actions
  dashboard/*  calendar/*  builder/*  scripts/*  analytics/*   (cards, grids, charts, tables)
  ui/*                            shadcn-generated primitives (button, card, sheet, ...)
```
Build order so each renders the moment it lands: **globals/tokens → ui primitives (shadcn) → mock.ts →
shell (sidebar + layout providers) → Dashboard → Calendar → Campaign Builder → Founder Scripts →
Analytics → Content Detail drawer → chat launcher.** Build the visual language/copy directly from PRD
§5/§6 (Brew Lab persona) — there is no separate prototype: warm, autopilot-forward, opinionated.

**Overlays live in the shell, not as routes:** the drawer (`{ openPostId }` in a Zustand store) and the
chat launcher are rendered in `layout.tsx` so they persist across navigation.

### 5c. Format-aware drawer actions (key off `post.format`)
all → Reschedule/Delete/Approve · `reddit_text`,`x_post`,`x_thread` → +inline copy edit · `ig_carousel`
→ +text-layer-only edit · `ig_single` → +caption edit + "Regenerate image" · `tiktok_script`,
`founder_script` → script edit + "Mark filmed", **no publish**.

**Verification gate (Phase 4):** with `NEXT_PUBLIC_USE_MOCK=true`, `npm run dev` renders all five
surfaces + the drawer + chat launcher without console errors; `npm run typecheck` exits 0; `npm run
build` succeeds. Then flip `NEXT_PUBLIC_USE_MOCK=false` and confirm Dashboard + Calendar read the seeded
Supabase rows (live reads) while the AI paths are still stubbed. `./verify.sh` exits 0.

---

## 6. AI content pipeline (Route Handlers + model tiering)

### 6a. Models (per the `claude-api` skill — verify exact IDs at build time)
| Job | Model | Notes |
|---|---|---|
| **Build-time seed gen** (full campaign written to Supabase) | `claude-opus-4-8` | best quality; offline, latency irrelevant; high effort / extended thinking |
| **On-stage live "Generate"** (`/api/generate`) | `claude-sonnet-4-6` | fast + **streamed**, medium effort, **8 posts** (not 12) to cut tail latency |
| **Chat-edit / cheap rewrites** (`/api/chat-edit`) | `claude-haiku-4-5` | single-post rewrite → patch |

API facts: structured output via **strict tools** (`strict:true`, `additionalProperties:false`) or
`output_config.format` — **no assistant prefill** on 4.x. JSON-schema string-length limits are **not**
enforced, so validate per-format caps (X ≤ 280, etc.) **server-side after parse**. Prompt-cache the
system + research dossier prefix. Web-search tool = **`web_search_20260209`** (current variant).

### 6b. `/api/generate` Route Handler — engineered for Vercel on-stage reliability
This is the live, on-stage streamed call running from the **deployed Vercel URL** — cold start +
serverless timeout are real risks. Mitigations are mandatory:

`src/app/api/generate/route.ts`:
```ts
export const runtime = "nodejs";   // Node, not Edge: Fluid pre-warm + full SDK + longer durations
export const maxDuration = 60;     // hard wall-clock cap (well under the 300s Fluid default; explicit)

export async function POST(req: Request) {
  // 1) read brief; load brand + cached research blob via the service-role client (server-only)
  // 2) AbortController with a ~25–30s budget around the Anthropic stream
  // 3) client.messages.stream(...) with the strict `emit_posts` tool; stream chunks to the client
  //    (SSE: Content-Type: text/event-stream, Cache-Control: no-cache, Connection: keep-alive)
  // 4) on first byte the audience sees tokens within ~1s; a token stream is its own heartbeat
  // 5) on timeout/abort OR API error → stream the cached GOLDEN PAYLOAD instead (never dead-end)
  // 6) validate per-format caps after parse; reuse the seeded campaign_id (don't create a 2nd campaign);
  //    bulk-insert NON-video posts at status='scheduled', approval_state='pending';
  //    insert VIDEO posts (tiktok_script + founder_script) at status='draft' AND a paired founder_scripts
  //    row (filmed=false) for EACH so either can be marked filmed (§1d/C2).
}
```
Reliability facts baked into the above (verified June 2026):
- **Fluid Compute is on by default**; the **default maxDuration is 300s on all plans** (the old
  10s/15s numbers are stale — do not cite them). For an 8-post Sonnet stream, 60s is ample.
- **Streaming does NOT extend `maxDuration`** — the cap covers the entire request including all streamed
  bytes. There is no per-chunk reset. Keep the work well inside the budget.
- **Pre-warm**: Fluid auto-pre-warms production deploys and Scale-to-One keeps ≥1 warm instance — but
  still hit the route once right before the demo as cheap insurance.
- **Cached "golden payload" fallback** (`src/lib/golden-payload.ts`): a pre-baked known-good JSON of ~8
  Brew Lab posts. Wrap the Claude call in `Promise.race`/`AbortController` (25–30s budget); on timeout or
  error, stream the golden payload so the live "Generate" never fails on stage. **This is the single most
  important safeguard.**
- Keep batch small (8) and stream tokens as they arrive so output appears within ~1s even if total
  generation runs several seconds.

### 6c. `/api/chat-edit` Route Handler
`runtime='nodejs'`, `maxDuration=30`. Haiku, strict tool returning a **patch over the §1b content
shape** (single-post intent only for the demo). Validate the patch server-side; on malformed output fall
back to a full single-post replace. The client applies the patch through the same React Query mutation
the drawer uses.

### 6d. Stages (adapted)
1. **§7.1 Research** — **mocked for the demo**: a pre-cached Brew Lab research blob injected into the
   generation prompt (cache it on the system prefix). Live `web_search_20260209` stays the **v1** path.
2. **§7.2 Generation** — one streamed `emit_posts` call whose schema **is** the `posts` row shape.
   Per-format: Reddit/X = LLM text · **IG carousel = LLM text + deterministic SVG/HTML→PNG render**
   (satori → `@resvg/resvg-js`, **build for real** — on-brand, never hallucinates a logo) · IG
   single-image = LLM caption + image-gen (**mock**: reuse the SVG card or drop from the default mix) ·
   tiktok_script/founder_script = LLM script, no video. The SVG→PNG render runs inside the Route Handler
   (Node runtime).
3. **§7.3 Scheduling** — pure code (no LLM): per-platform best-time table × even distribution of the
   frequency preset across the duration. Video formats get a calendar placeholder (`status='draft'`,
   gated on `filmed=true`) + a `filming_reminder` suggestion; never enter the publish query.
4. **§7.4 Publishing** — **mocked entirely** (see §6/§7 below): Approve flips `approval_state`; the
   "publish" path transitions `scheduled→published` + a toast and writes a synthetic `external_post_id`.
   The real per-channel publisher (with bounded retry → `needs_attention`/`stalled`) is v1.
5. **§8 Learning loop** — demo: a rule-based "next move" over the seeded `post_metrics` feeds the Recap
   recs and Dashboard suggestions. v1: per-account learning signals into the next campaign prompt + a
   nightly cross-account rollup.

**Verification gate (Phase 5)** — copy-paste runnable with the pinned fixtures from §4d:
```bash
BRIEF='{"brand":"Brew Lab","voice":"warm_witty","goal":"orders","channels":["reddit","x","instagram","tiktok"],"account_id":"00000000-0000-0000-0000-00000b1e51ab","campaign_id":"00000000-0000-0000-0000-0000ca33a191"}'
curl -N -X POST localhost:3000/api/generate -H 'content-type: application/json' -d "$BRIEF"   # streams SSE
# then: select count(*) from posts where campaign_id='00000000-0000-0000-0000-0000ca33a191'  → up by 8
# force fallback: set ANTHROPIC_API_KEY=bad temporarily → same curl still streams the GOLDEN payload + inserts
EDIT='{"postId":"00000000-0000-0000-0000-0000905709a1","message":"rewrite warmer; add our 4am bottling story"}'
curl -X POST localhost:3000/api/chat-edit -H 'content-type: application/json' -d "$EDIT"       # → patch
```
The `/api/chat-edit` response must be a valid patch matching the `PostContent` type; `npm run typecheck`
exits 0.

---

## 7. Social OAuth & publishing reality

**Bottom line: mock publishing on every channel for the live demo.** Every channel except X-to-your-own
account requires multi-week app review that cannot complete in a sprint. Invest the saved time in great
in-app channel-native previews in the drawer — they sell the product better than a half-working API.

| Channel | Read API | Write/publish | Review gate | Demo call |
|---|---|---|---|---|
| **X** | Yes (OAuth2 PKCE) | Yes (`tweet.write`, pay-per-use) | **None for own account** | **Mock** |
| **Reddit** | Yes (free) | Yes (`submit`, free) | karma/age gates on real subs | **Mock** |
| **Instagram** | Yes (IG Login API) | `instagram_business_content_publish` | **HARD: Meta App Review 2–4 wks** | **Mock** |
| **TikTok** | sandbox-only w/o audit | `video.publish` Direct Post | **HARD: full app audit 1–4 wks** | **Mock (founder-posted)** |

**The PRD's "TikTok/video is founder-posted, never auto-published" is FORCED by API reality** (audit gate
+ private-only sandbox + Offload only produces a *script*) — the correct permanent v1 design, not a
shortcut.

**OAuth flow (v1 shape, stubbed for demo):** server-side Authorization Code + **PKCE** would live in a
Route Handler (`src/app/api/oauth/[provider]/route.ts`) with tokens persisted to `social_accounts`
(Vault-encrypted in v1). For the demo, the onboarding "Connect" button just flips
`social_accounts.status='mock'` / `read_scope=true`. A `ChannelPublisher` interface
(`canAutoPublish`: x/reddit true, ig/tiktok false) keeps mock vs real swappable — mocked channels
transition `scheduled→published` with a synthetic `external_post_id` so the whole UI behaves identically.

**Verification gate (Phase 6):** clicking "Connect accounts" in onboarding sets every enabled
`social_accounts.status='mock'`; Approve on a Reddit/X post flips `approval_state='approved'` then the
mock publisher sets `status='published'` + `external_post_id` and fires a Sonner `toast()`; a
`tiktok_script`/`founder_script` post shows **no** publish action and "Mark filmed" sets `filmed=true`
**and** flips the post `status` draft→scheduled (C5).

---

## 8. Agent task sequence (dependency spine)

No human schedule. Execute phases in order; the **dependency** of each on the prior is the gate. **One
consistent scheme: Phase 0..8, no gaps** — each phase maps to exactly one Verification gate above/below.

0. **Phase 0 — Contract** (`CONTRACT.md`). Blocks all SQL + TSX.
1. **Phase 1 — Services** (Supabase project + MCP, Anthropic key, Vercel project). Blocks schema + deploy.
2. **Phase 2 — Scaffold** (Next.js + shadcn + clients + scripts). Blocks everything UI/API.
3. **Phase 3 — Schema + types + seed** (MCP migration, `update-types`, Brew Lab seed). Blocks live reads
   and AI writes. *Depends on 0, 1, 2.*
4. **Phase 4 — Surfaces** (typed `api.ts`, mock first → live reads). *Depends on 2, 3.*
5. **Phase 5 — AI Route Handlers** (`/api/generate` streamed + golden fallback, `/api/chat-edit`).
   *Depends on 3 (insert target) + 4 (UI to render into).*
6. **Phase 6 — OAuth/publish mock** + onboarding Connect. *Depends on 3, 4.*
7. **Phase 7 — Integration + deploy** (below). *Depends on all prior.*
8. **Phase 8 — E2E (Playwright) + PR** (below). *Depends on 7.*

**Phase 7 — Integration + deploy**
- Wire the 9-step path end to end against live Supabase + live Route Handlers (flip
  `NEXT_PUBLIC_USE_MOCK=false`).
- Push the branch; let Vercel build the **production URL** (or `vercel deploy --prod --yes --token
  $VERCEL_TOKEN`). Confirm all env vars are set in Vercel (especially the unprefixed secrets).
- **Run the live `/api/generate` from the deployed URL** (not localhost). Confirm streaming works on
  Vercel, the golden fallback triggers on forced failure, and cold-start is masked by the token stream.
- Tune seeded analytics so the Recap verdict is punchy; ensure failed-gen → golden payload, never blank.
- Emit 2–3 PostHog events.

**Verification gate (Phase 7)** — machine-checkable (no human-in-the-loop):
```bash
DEPLOY_URL=https://<app>.vercel.app
./verify.sh   # exits 0
# live generate streams from the deployed URL:
curl -N -X POST "$DEPLOY_URL/api/generate" -H 'content-type: application/json' -d "$BRIEF"   # SSE chunks
# forced-failure proves the golden-payload fallback (server reads a per-request override or a flipped
# env): the SAME curl with a header that forces an Anthropic error still streams the golden payload:
curl -N -X POST "$DEPLOY_URL/api/generate" -H 'x-force-fail: 1' -H 'content-type: application/json' -d "$BRIEF"
```

**Phase 8 — E2E (Playwright) + open PR**
- Install Playwright: `npm i -D @playwright/test && npx playwright install --with-deps chromium`.
- Add `e2e/demo-path.spec.ts` — a spec that walks all **9 steps** (§9) against `$DEPLOY_URL`, asserting
  both UI state (each surface renders; chat-edit preview updates the post; Approve fires the Sonner toast;
  Mark-filmed activates the placeholder) **and** DB state (post count up by 8; the seed post's content
  changed; `approval_state='approved'`; `filmed=true`). Use the pinned fixtures from §4d.
- Run it **3×** (`for i in 1 2 3; do npx playwright test || exit 1; done`); keep the API-level curl checks
  from the Phase-7 gate too.
- Open the PR non-interactively:
  ```bash
  git push -u origin feat/scaffold-nextjs
  gh pr create --fill --base main   # or: gh pr create --base main --title "..." --body "..."
  ```

**Verification gate (Phase 8):** `npx playwright test` **passes 3×** against the deployed Vercel URL with
no manual DB fixes; the Phase-7 forced-failure curl still streams the golden payload; the PR is open.

**HUMAN handoff (post-build, after Phase 8 — NOT an agent gate):** a human records a **backup screen
recording** of one clean golden run from the deployed URL (an agent cannot capture screen video). This is
a presentation safety net, not a build gate — Phase 8's Playwright + forced-failure curl already prove the
path machine-side.

---

## 9. The critical demo path (Brew Lab, ~4 min) — unchanged in substance, TSX surfaces

1. **Onboarding (<60s, pre-filled):** Brand "Brew Lab" / warm-witty / goal=orders → toggle 4 channels →
   "Connect accounts" (one click → `status='mock'`) → Loading. (`onboarding/page.tsx`)
2. **Live "Generate"** fires the real Sonnet call to `/api/generate` → 2-week, ~8 fresh posts streamed;
   calendar otherwise fills from seed. Lands on Dashboard.
3. **Dashboard reads as autopilot:** KPI row, campaign hero (%complete / next post / forecast),
   "Next up", 7-day signups chart, channel bars, one AI suggestion (seeded). (`dashboard/*`)
4. **Calendar** across all 4 channels; TikTok tiles visibly marked founder-filmed placeholders.
   (`calendar/*`)
5. **Founder Scripts:** open a `founder_script` (hook/beats/shot-note) → **"Mark filmed"** activates its
   calendar placeholder. (`scripts/*`)
6. **Chat-edit (the wow moment):** open a Reddit/X post → preview + rationale → chat *"rewrite this warmer
   and add a line about our 4am bottling story"* → **single-post** structured diff preview via
   `/api/chat-edit` → confirm → drawer updates live. (`drawer/content-detail.tsx` +
   `shell/chat-launcher.tsx`)
7. **Approve** (+ Approve-all) → `approval_state='approved'` → mock "Published to X ✓" toast.
8. **Analytics Recap:** verdict hero, 2-week chart, format table, ranked next-move recs (seeded).
   (`analytics/*`)
9. **Brief next:** click a rec → **pre-filled Campaign Builder** (`/build?prefill=...`) → closes the loop.

Non-negotiable: steps 6 and 8. Step 9 can be shown as "pre-filled builder" without re-generating.

---

## 10. Build-real vs mock (consolidated)

**Build real:** Supabase schema + seed + generated TS types · all five TSX surfaces + drawer + chat
launcher · `/api/generate` (Sonnet, streamed, golden fallback) · `/api/chat-edit` (Haiku, single-post) ·
IG carousel SVG→PNG · Founder Scripts + Mark-filmed · Dashboard + Calendar on live reads · Approve
mutations · 2–3 PostHog events · Vercel deploy.
**Seed:** `post_metrics`, `conversions`, `cross_account_aggregates`, the full campaign (safety net).
**Mock:** all OAuth + all publishing (status flip + toast) · §7.1 research (cached blob) · IG
single-image gen · conversion attribution ingestion · notifications (in-app cards).
**Cut:** Auth/RLS · pgmq/pg_cron/Edge-Function publisher · Gmail/Calendar sync · real cross-account
learning · failure-state machine (one graceful fallback only) · everything in PRD §12.

---

## 11. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Live generation slow/flaky from the deployed Vercel URL** (cold start + serverless timeout) | Node runtime + `maxDuration=60`; Fluid Compute (default) pre-warm + Scale-to-One; manual warm-up call pre-demo; 8-post batch; **stream tokens** so output shows in ~1s; **25–30s AbortController budget → cached golden-payload swap-in**; backup video |
| R2 | Streaming silently exceeds `maxDuration` (no per-chunk reset) | Keep work well under budget; 8 posts; the golden fallback fires before the wall-clock cap |
| R3 | Chat structured-diff malformed | Strict tool schema, validate server-side against `PostContent`; fall back to full single-post replace; single intent only for demo |
| R4 | Real OAuth/publishing impossible in a sprint | Mock all; flag platform constraints as drawer **copy**, not behavior |
| R5 | Attribution gap (#9) weakens analytics story | Seed the curve; name attribution as the #1 v1 build; don't fake a mechanism |
| R6 | Contract drift between SQL, types, `api.ts`, Route Handlers | Freeze §1 at Phase 0; **generate TS types from schema**; `tsc` catches column/table mismatches |
| R7 | Image-gen rabbit hole | IG single-image off critical path; templated SVG placeholder |
| R8 | Scope creep into deferred surfaces | Hard-cut: anything off the 9-step path is out |
| R9 | Secret leaks into client bundle | Only `NEXT_PUBLIC_*` reach the browser; secrets unprefixed, read only in Route Handlers; gateway rejects `sb_secret_*` from a browser |
| R10 | Scaffold/CLI flag drift (Next 16 / shadcn v4) | Use `@latest` + `--yes`; verify flags via `--help` at build time; `--src-dir` is required, not default |

---

## 12. Definition of done (demo)

In one uninterrupted run **on the deployed Vercel URL**: (1) onboarding → Dashboard; (2) a **real Claude
call** to `/api/generate` streams and generates a campaign across 4 channels, persisted in Supabase,
Calendar renders every post (TikTok as placeholders); (3) a text post shows preview + rationale, and a
**NL chat instruction via `/api/chat-edit` produces a previewed change that updates the post live on
confirm**; (4) Approve/Approve-all flips status with a mock-publish confirmation, no errors; (5) Analytics
Recap shows verdict + chart + format table + ranked recs; (6) a rec lands in a **pre-filled Builder**;
(7) the **Playwright e2e passes 3×** against the deployed URL with no manual DB fixes and the
**golden-payload fallback is proven** to fire on a forced-failure `/api/generate`. `./verify.sh`
(typecheck + lint + test, lint = eslint) exits 0. (A human-recorded **backup screen recording** is a
post-build presentation safety net, not an agent gate.)

---

## 13. Open questions still owned by a human (from PRD §13)

Resolved-for-demo here, but **real v1 must decide**: **#9 conversion attribution** (largest gap — UTM
where allowed + Offload snippet + self-report); **#10 write-OAuth timing** (recommend read-only at
onboarding, write at first publish, manual-post fallback); **#5 first-campaign defaults** (2w / ~35 /
balanced — confirm); **#6 "Approve all" scope** (resolved here: `status='scheduled' AND approval_state='pending'` posts in the
current channel filter — never sweeps founder-posted video drafts).

---

## 14. What real v1 adds beyond the demo

Real magic-link Auth + RLS + Vault-encrypted tokens · the pgmq/pg_cron publisher with retry/stall
handling (could run as Supabase Edge Functions or a Vercel Cron-triggered Route Handler) · real
per-channel OAuth (Meta App Review + TikTok audit started day 1) · real §7.1 research + own-history
ingestion · a real per-account + cross-account learning store · conversion attribution · the real chat
instruction engine (calendar-wide ops) · settings/approval-policy screens · notifications (Gmail) ·
accessibility/responsive/error-boundary passes. Everything mocked above is a **swap-in behind an existing
TypeScript interface, not a rewrite.**

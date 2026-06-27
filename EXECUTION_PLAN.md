# Offload — Execution Plan (hackathon, 1–2 day sprint)

Start-to-finish plan to build **Offload** (marketing autopilot for solo founders — see `PRD.md`).
Produced by a multi-agent pass (6 workstream planners + 2 adversarial critics) and reconciled into
one internally-consistent plan. Where the raw workstreams disagreed, the resolved decision is marked
**[resolved]** with the reasoning.

> **The single most important rule:** freeze the data contract (Phase 0) **before** generating any
> `src/*.jsx` or SQL. Both critics flagged that the schema, the frontend data layer, and the OAuth
> code disagreed on table names, the tenant key, and the post-status model — and that this collision
> is what eats the integration half-day. Fix it once, up front, and every other workstream composes.

---

## 0. Shape of the build (architecture, reconciled)

Three deployable pieces, nothing more:

| Piece | Tech | Role |
|---|---|---|
| **Web app** | React + Vite (JSX), React Router, Zustand, TanStack Query | The 5 surfaces + onboarding + chat + drawer |
| **Backend** | **Supabase** (Postgres + Storage) | All data + brand-asset files |
| **AI service** | **ONE plain Node/Express process** (`/generate`, `/chat-edit`) | Long Claude calls; holds the secret keys |

**[resolved] Backend execution model.** The raw plan offered up to four surfaces (pgmq + pg_cron +
Edge Functions + a worker). For a 2-day demo that is over-built. **Collapse to one Node/Express
process** the frontend calls via `fetch`. The queue/cron/worker/Edge-Function design is the documented
**v1** path, not the demo path.

**[resolved] Auth for the demo = none.** Skip Supabase Auth + RLS for the sprint: one hardcoded
`account_id`, RLS disabled (or fully permissive), Vite app on the anon key. This removes an entire
class of "why is my query empty" bugs. Real magic-link Auth + per-table RLS (`account_id = auth.uid()`)
is a **v1** add. Onboarding still **persists the brand to a Supabase `brands` row** (not localStorage)
so the AI service can read it.

**Secrets never touch the browser.** `ANTHROPIC_API_KEY`, image-gen keys, and the Supabase
`service_role` key live only in the Node service's `.env`. The Vite bundle gets only the Supabase URL +
**publishable/anon** key.

---

## 1. Phase 0 — Freeze the contract (do this FIRST, ~1 hr, blocks everything)

Write **one** canonical doc (a `CONTRACT.md` or the top of the migration) that `src/data.jsx`,
`src/lib/api.js`, the SQL, and the AI service all conform to. It pins three things:

### 1a. Tables, tenant key, status model
- **Tenant key is `account_id`** everywhere (one account = one founder = one brand in v1).
- **Plural table names**: `accounts, brands, brand_assets, social_accounts, campaigns, posts,
  founder_scripts, post_metrics, tracked_links, conversions, suggestions, notifications,
  cross_account_aggregates`.
- **Post state is two columns** (this is the contract everyone got wrong):
  - `posts.status` ∈ `draft | scheduled | published | needs_attention | stalled`
  - `posts.approval_state` ∈ `pending | approved | rejected`
  - The PRD's "**scheduled (pending approval)**" = `status='scheduled'` + `approval_state='pending'`.
  - **Approve** sets `approval_state='approved'` (NOT `status='scheduled'`).
  - Publisher selects `status='scheduled' AND approval_state='approved' AND scheduled_at<=now()
    AND channel IN ('reddit','x','instagram')`.
- `posts` orders by **`scheduled_at`** (not `schedule`). `src/lib/api.js` must use plural tables +
  these exact column names.

### 1b. `posts.content` JSONB shape per format
```jsonc
reddit_text  | x_post  : { "title": "...", "body": "..." }
x_thread              : { "tweets": ["...", "..."] }
ig_carousel           : { "slides": [{"heading":"...","sub":"..."}], "caption":"..." }  // text layer only
ig_single             : { "caption":"...", "image_prompt":"...", "image_path":"brand-assets/<acct>/generated/..." }
tiktok_script         : { "hook":"...", "scenes":["..."], "shot_note":"...", "duration_sec":30 }
founder_script        : (lives in founder_scripts row: angle,hook,beats[],shot_note,duration_sec)
```
The chat-edit endpoint returns a **patch over this same shape** so "apply" goes through the exact same
TanStack mutation the drawer uses.

### 1c. Define the three undefined PRD terms (blocks Analytics + Approve-all)
- **forecast** = `frequency × duration × per-channel best-time impression heuristic`, stored on
  `campaigns.forecast` jsonb `{impressions, signups}`. It's the Dashboard "forecast vs actual" baseline.
- **engagement_rate** = `engagements / impressions` (per post; aggregate by sum/sum).
- **"Approve all"** scope = all `approval_state='pending'` posts **in the current calendar channel filter**.

### 1d. [resolved] Video content model (PRD open question #11)
- `founder_script` (talking-head) = the **Founder Scripts surface** (`scripts.jsx`) content.
- `tiktok_script` (scene-by-scene) = the **TikTok channel's** content.
- **Both** gate calendar activation on `filmed=true`, **neither** enters the publish query — founder
  posts video manually. Offload tracks `filmed` only. (This is *forced* by API reality — see §6.)

---

## 2. MCP & external service setup (the do-this-first checklist)

Legend: 🟢 build real · 🟡 real if time, else mock · 🔴 mock/skip for demo.

| # | Item | Priority | Real? | Time | Credentials |
|---|------|----------|-------|------|-------------|
| 1 | **Supabase hosted project** | P0 | 🟢 | 10 min | account, DB pw, project ref, anon + service_role keys |
| 2 | **Supabase MCP server** (`claude mcp add`) | P0 | 🟢 | 10 min | Supabase OAuth **or** PAT + project ref |
| 3 | **Anthropic API key** (separate from Claude Code sub) | P0 | 🟢 | 5 min | console.anthropic.com key + billing |
| 4 | **Node AI service** scaffold (`/generate`,`/chat-edit`) | P0 | 🟢 | 20 min | service_role + Anthropic key in its `.env`; CORS for Vite origin |
| 5 | **Prototype `src/*.jsx`** via DesignSync / regenerate | P0 | 🟢 | 30–90 min | claude.ai design auth (Option A) / none (Option B) |
| 6 | Image-gen API (IG single-image) | P2 | 🔴→🟡 | 15 min | one provider key (Imagen / GPT-Image / fal.ai) |
| 7 | Web-search / research (§7.1) | P2 | 🔴→🟡 | 5–10 min | none (Anthropic native) / Tavily/Exa/Brave key |
| 8 | **PostHog** product analytics | P1 (already connected) | 🟢 | 0–20 min | PostHog project API key for `posthog-js` |
| 9 | Gmail MCP (§9 email notifs) | P3 | 🔴 | 10 min | claude.ai connector OAuth |
| 10 | Google Calendar MCP | P3 | 🔴 | — | claude.ai connector OAuth |

**The big rocks are #1–#5.** Mock everything else and you still have a credible demo; without #1–#5
there is no app.

### Key setup details
- **Supabase project**: create at supabase.com → grab `URL`, `anon`/publishable key (`sb_publishable_…`,
  the 2026 key format — legacy anon JWTs deprecating through end-2026), and `service_role` (server-only).
- **Supabase MCP** (verified June 2026): official hosted remote server at `https://mcp.supabase.com/mcp`.
  ```bash
  claude mcp add --scope project --transport http \
    supabase "https://mcp.supabase.com/mcp?project_ref=<REF>"
  # then: claude → /mcp → Authenticate (browser OAuth). PAT alternative via Authorization: Bearer header.
  ```
  Lets this agent run the DDL + seed directly. Docs note it's dev/test only — fine for a hackathon.
  Fallback: emit `supabase/migrations/0001_init.sql` and `supabase db push` via the CLI.
- **Anthropic key**: `npm i @anthropic-ai/sdk`; key is **metered, separate from your Claude Code
  subscription**. A full demo's generation is cents.
- **Node AI service** (the piece the raw plan forgot to list): `mkdir service && npm init -y &&
  npm i express @anthropic-ai/sdk @supabase/supabase-js cors`. Runs locally (`node service.js`).
  `.env`: `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Add a CORS allow-list for
  `http://localhost:5173`.
- **Prototype bundle** — the 13 `src/*.jsx` files + `styles.css` are referenced as canonical but **do
  not exist in the repo yet**. Options: **(A)** pull from a Claude Design project via the `DesignSync`
  tool / `/design-sync` skill if one exists (`list_projects` first, ~10-min timebox); **(B) [default]**
  regenerate from PRD §5/§6 with Claude into a Vite app. Start with A, fall back to B fast.
- **PostHog** (already connected, project `363064`): use for **Offload's own** funnel
  (`onboarding_completed`, `campaign_generated`, `post_approved`). Keep the founder-facing campaign
  analytics in **Supabase `post_metrics`** (seeded) — don't mix the two. The connected MCP can build a
  real "people are using Offload" dashboard for you.

---

## 3. Backend — Supabase (data model)

Entity tree (all hang off one `accounts` row; `account_id` is the universal key):
```
accounts ─┬─ brands (1:1) ─ brand_assets (1:N)
          ├─ social_accounts (1:N, one per provider; read_scope/write_scope booleans + status)
          ├─ campaigns (1:N) ─┬─ posts (1:N) ─┬─ post_metrics (1:N)
          │                   │               └─ tracked_links (1:N)
          │                   └─ founder_scripts (1:1, video posts)
          ├─ suggestions / notifications / conversions (1:N)
          └─ (global) cross_account_aggregates  ← anonymized learning, NO account_id
```

### Core DDL (reconciled — single `social_accounts`, `account_id` tenant key, plaintext tokens for demo)
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

-- attribution (#9): tables built now, INGESTION seeded for demo
create table tracked_links ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), post_id uuid references posts(id),
  slug text unique, destination_url text, utm jsonb default '{}', click_count int default 0 );
create table conversions ( id uuid primary key default gen_random_uuid(),
  account_id uuid references accounts(id), tracked_link_id uuid references tracked_links(id),
  post_id uuid references posts(id), kind text check (kind in ('signup','order')),
  value numeric default 0, source text check (source in ('utm','snippet','platform','self_report')),
  occurred_at timestamptz default now() );
-- plus suggestions, notifications (account-scoped) and cross_account_aggregates (global, seeded)
```

- **Storage**: one bucket `brand-assets`; generated images go to `brand-assets/<account_id>/generated/`
  (don't introduce a second bucket — the raw plan's `generated-images` bucket was never created).
- **Seed** (`seed.sql`): a full Brew Lab account — brand, a 2-week campaign, ~20–35 posts across all 4
  channels, founder_scripts, a believable 7-day `post_metrics` curve, a few `conversions`,
  `suggestions`, and a small `cross_account_aggregates`. **The seed is the demo's safety net** — the
  app renders fully even if a live call fails.
- **v1 hardening** (out of demo scope): magic-link Auth + a trigger that seeds `accounts`+`brands` on
  signup; per-table RLS `account_id = auth.uid()`; OAuth tokens in Supabase Vault; `pg_cron`+`pgmq`
  publisher.

---

## 4. Frontend (React + Vite)

**Stack** (verified June 2026): Vite 7 (`create-vite`, needs Node 20.19+/22.12+), `react` template
(plain JSX — keep it JSX so the design bundle drops in verbatim), `react-router-dom` v7,
**Zustand** (UI/session state), **TanStack Query v5** (all Supabase reads/mutations),
`@supabase/supabase-js` v2, `recharts` for the two charts.

```bash
npm create vite@latest . -- --template react      # scaffold in place; keep PRD.md/CLAUDE.md/etc.
npm install
npm install react-router-dom zustand @tanstack/react-query @supabase/supabase-js recharts
npm install -D eslint prettier vitest @testing-library/react jsdom
printf 'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=sb_publishable_...\nVITE_USE_MOCK=true\n' > .env.local
echo ".env.local" >> .gitignore
```
Add `package.json` scripts so the existing `./verify.sh` lights up: `dev/build/preview`,
`lint: eslint .`, `test: vitest run`, and `typecheck` → point at `eslint .` (JSX project) so verify
stays green.

**Generate the 13 files (Option B) in dependency order** so each renders the moment it lands:
`styles.css → icons.jsx → ui.jsx → data.jsx (Brew Lab mock, byte-aligned to §1 contract) →
sidebar.jsx + app.jsx → dashboard → calendar → campaign-builder → scripts → analytics →
content-detail.jsx`.

**Routing & overlays** (`app.jsx`): routes for `/onboarding`, `/` (Dashboard), `/calendar`, `/build`
(accepts `?prefill=` from Analytics recs), `/scripts`, `/analytics`. **Drawer** (`{openPostId}` in
Zustand) and **chat launcher** (bottom-right floating, persists across routes) are overlays in the
Shell, not routes.

**Format-aware drawer actions** (key off `post.format`):
all → Reschedule/Delete/Approve · reddit,x → +inline copy edit · ig_carousel → +text-layer-only edit ·
ig_single → +caption edit + "Regenerate image" · tiktok_script,founder_script → script edit + "Mark
filmed", **no publish**.

**The mock→live seam** — one module everything imports (never `data.jsx`/`supabase` directly):
```js
// src/lib/api.js   (column names MUST match the §1 contract)
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
export const api = {
  getCampaign: () => USE_MOCK ? mock.campaign : sb.from("campaigns").select("*, posts(*)").single(),
  getPosts:    () => USE_MOCK ? mock.posts    : sb.from("posts").select("*").order("scheduled_at"),
  getScripts:  () => USE_MOCK ? mock.scripts  : sb.from("founder_scripts").select("*"),
  getMetrics:  () => USE_MOCK ? mock.metrics  : sb.from("post_metrics").select("*"),
  approvePost: (id) => sb.from("posts").update({ approval_state: "approved" }).eq("id", id),
  markFilmed:  (id) => sb.from("founder_scripts").update({ filmed: true }).eq("id", id),
  generate:    (brief) => fetch(`${SERVICE}/generate`, {method:"POST", body: JSON.stringify(brief)}),
  chatEdit:    (msg, postId) => fetch(`${SERVICE}/chat-edit`, {method:"POST", body: ...}),
};
```
Wrap each in a TanStack Query hook → loading/error/empty states for free. **Swap mock→live per entity**
by flipping `VITE_USE_MOCK` (Dashboard can go live while Analytics is still mock).
**Generate→Calendar transition = awaited `fetch` + `queryClient.invalidateQueries`** (no Supabase
Realtime — unneeded ceremony for the demo).

---

## 5. AI content pipeline

### Models (per the `claude-api` skill, June 2026 — verify IDs at build time)
| Job | Model | Notes |
|---|---|---|
| **Build-time seed gen** (full campaign written to Supabase) | `claude-opus-4-8` | best quality; non-interactive so latency irrelevant; `thinking:{type:'adaptive'}`, `output_config:{effort:'high'}` |
| **On-stage live "Generate"** | `claude-sonnet-4-6` | **[resolved]** fast + streamed, effort `medium`, **8–12 posts** — defuses the on-stage latency risk Opus-at-xhigh would create |
| **Chat-edit / cheap rewrites** | `claude-haiku-4-5` | single-post rewrite |

API facts: structured output via **strict tools** (`strict:true`, `additionalProperties:false`) or
`output_config.format` — **no assistant prefill** on 4.x. JSON-schema string-length limits are **not**
enforced, so validate per-format caps (X ≤ 280, etc.) **client-side after parse**. Stream large
generations. Prompt-cache the system + research dossier prefix (≈90% cheaper across the ~20–35 posts).
Web search tool = **`web_search_20260209`** (the current variant; the stale `web_search_20250305` was a
bug in one workstream).

### Stages
1. **§7.1 Research** — **[resolved] mock for the demo**: pre-cache a Brew Lab research blob and inject
   it into the generation prompt. Live `web_search_20260209` is a latency + flakiness vector with no
   on-screen payoff (the audience sees posts, not a dossier). Keep the real one-Opus-call-with-web-search
   path as the **v1** implementation (and an off-path "research moment" if you want flavor).
2. **§7.2 Generation** — one streamed call emits all text posts at once via a strict `emit_posts` tool
   whose schema **is** the `posts` row shape (channel/format/title/rationale/`content`). Worker
   validates per-format caps, bulk-inserts at `status='scheduled', approval_state='pending'`.
   Per-format: Reddit/X = LLM text · **IG carousel = LLM text + deterministic SVG/HTML→PNG render**
   (satori → `@resvg/resvg-js`, **build this for real** — cheap, on-brand, never hallucinates a logo) ·
   IG single-image = LLM caption + image-gen (**mock**: reuse the SVG card, or drop from the default
   mix) · tiktok_script/founder_script = LLM script, no video.
3. **§7.3 Scheduling** — pure code (no LLM): per-platform best-time table × even distribution of the
   frequency preset across the duration. Video formats get a **calendar placeholder** (`status='draft'`,
   gated on `filmed=true`) + a `filming_reminder` suggestion; they never enter the publish query.
4. **§7.4 Publishing** — **[resolved] mocked entirely for the demo** (see §6): Approve flips
   `approval_state`, the "publish" path just transitions `scheduled→published` + a toast. The real
   per-channel publisher (with silent bounded retry → `needs_attention`/`stalled`) is v1.
5. **§8 Learning loop** — demo: a rule-based "next move" over the seeded `post_metrics` feeds the Recap
   recs and Dashboard suggestions. v1: per-account `learning_signals` injected into the next campaign's
   system prompt + a nightly cross-account anonymized rollup.

---

## 6. Social OAuth & publishing reality

**Bottom line: mock publishing on every channel for the live demo.** Every channel except X-to-your-own
-account requires multi-week app review that cannot complete in a sprint. Invest the saved time in
great in-app channel-native previews in the drawer — they sell the product better than a half-working API.

| Channel | Read API | Write/publish | Review gate | In 1–2 days | Demo call |
|---|---|---|---|---|---|
| **X** | Yes (OAuth2 PKCE) | Yes (`tweet.write`, pay-per-use ~$0.015/post, $0.20 w/ link) | **None for own account** | possible | **Mock** (optional real backup clip) |
| **Reddit** | Yes (free, 100 QPM) | Yes (`submit`, free) | none, but subreddit karma/age gates real posts | real-ish in own test sub | **Mock** |
| **Instagram** | Yes (IG Login API, no FB Page) | `instagram_business_content_publish` | **HARD: Meta App Review 2–4 wks** + Business/Creator acct | **No** | **Mock** |
| **TikTok** | sandbox-only w/o audit | `video.publish` Direct Post | **HARD: full app audit 1–4 wks**, needs real footage | **No** | **Mock (founder-posted)** |

**[resolved] The PRD's "TikTok/video is founder-posted, never auto-published" is FORCED by API reality**
(audit gate + private-only sandbox + Offload only produces a *script*, not footage) — it's the correct
permanent v1 design, not a shortcut.

**OAuth flow (v1 shape, stubbed for demo):** server-side Authorization Code + **PKCE** via the Node
service; tokens persisted to `social_accounts` (Vault-encrypted in v1). For the demo, the "Connect"
button just flips `social_accounts.status='mock'` / `read_scope=true`. A `ChannelPublisher` interface
(`canAutoPublish`: x/reddit true, ig/tiktok false) keeps mock vs real swappable — mocked channels
transition `scheduled→published` with a synthetic `external_post_id`, so the whole UI behaves identically.

**v1 OAuth decisions to make:** grant **read-only at onboarding** (for §7.1 history) and **write at
first publish** per channel, with a "manual-post mode" fallback (#8/#10) that still generates everything
and offers copy/download. Start Meta App Review + TikTok audit on **day 1** of v1 (calendar-time, not
engineering-time).

---

## 7. Sprint sequencing (~4 half-days = 2 days, small team)

Dependency spine: **Phase 0 contract → setup + schema → (frontend ∥ AI service) → integration → polish.**

**H1 — Contract, setup & schema (unblocks everything)**
- Phase 0: write the contract doc (§1). *Do this before any code.*
- Supabase project + MCP; Anthropic key; scaffold the Node service shell; confirm PostHog MCP.
- `supabase db push` the schema + `seed.sql` (Brew Lab). **Blocks frontend live-reads + AI writes.**
- In parallel: scaffold Vite, **generate the 13 `src/*.jsx`** (they don't exist), wire routing + styles.

**H2 — Two big tracks in parallel**
- Frontend: build Dashboard, Calendar, Campaign Builder, **Founder Scripts**, drawer — against the
  `data.jsx` mock first (so screens render before the service lands).
- AI service: `/generate` (Sonnet, 8–12 posts → insert `posts`) and `/chat-edit` (Haiku, single-post
  rewrite → patch). Build the **IG carousel SVG→PNG** renderer.
- Analytics: `post_metrics` seed + rule-based Recap verdict/recs (no model needed).

**H3 — Integration (the linchpin — protect this time)**
- Onboarding Loading → real `/generate` → Calendar fills (flip those entities to live).
- Drawer chat → `/chat-edit` → preview diff → confirm → live update. **This is the wow moment; guard it.**
- Approve / Approve-all → status change + mock-publish toast. Recap rec → pre-filled Builder.

**H4 — Polish & dry runs**
- Tune seeded analytics so the Recap verdict is punchy; loading/error fallbacks (failed gen → cached
  good payload, never a blank); copy pass on "Why Offload wrote this."
- Emit 2–3 PostHog events (do it here or in H2 — **not** during H3 crunch).
- **Run the full path 3×; record a backup video of the golden run.**

2–3 people: A = schema + AI service, B = frontend, C/A = integration + analytics seed + demo script.

---

## 8. The critical demo path (Brew Lab, ~4 min)

1. **Onboarding (<60s** — pre-filled): Brand "Brew Lab" / warm-witty / goal=orders → toggle 4 channels
   → "Connect accounts" (one click → `status='mock'`) → Loading.
2. **Live "Generate"** fires the real Sonnet call → 2-week, ~8–12 fresh posts; calendar otherwise fills
   from seed. Lands on Dashboard.
3. **Dashboard reads as autopilot**: KPI row, campaign hero (%complete / next post / forecast),
   "Next up", 7-day signups chart, channel bars, one AI suggestion (seeded metrics).
4. **Calendar** across all 4 channels; TikTok tiles visibly marked founder-filmed placeholders.
5. **Founder Scripts**: open a `founder_script` (hook/beats/shot-note) → **"Mark filmed"** activates its
   calendar placeholder. *(Added so the 5th canonical surface isn't orphaned.)*
6. **Chat-edit (the wow moment)**: open a Reddit/X post → preview + rationale → chat *"rewrite this
   warmer and add a line about our 4am bottling story"* → **single-post** structured diff preview →
   confirm → drawer updates live. *(Single-post intent only; calendar-wide ops are stretch.)*
7. **Approve** (+ Approve-all) → `approval_state='approved'` → mock "Published to X ✓" toast.
8. **Analytics Recap**: verdict hero, 2-week chart, format table, ranked next-move recs (seeded).
9. **Brief next**: click a rec → **pre-filled Campaign Builder** → closes the loop.

Non-negotiable: steps 6 and 8. Step 9 can be shown as "pre-filled builder" without re-generating.

---

## 9. Build-real vs mock (consolidated)

**Build real:** Supabase schema + seed · the 13 `src/*.jsx` + all 5 surfaces · `/generate` (Sonnet) ·
`/chat-edit` (Haiku, single-post) · IG carousel SVG→PNG · Founder Scripts + Mark-filmed · Dashboard +
Calendar on live reads · Approve mutations · 2–3 PostHog events.
**Seed:** `post_metrics`, `conversions`, `cross_account_aggregates`, the full campaign (safety net).
**Mock:** all OAuth + all publishing (status flip + toast) · §7.1 research (cached blob) · IG
single-image gen · conversion attribution ingestion · notifications (in-app cards).
**Cut:** Auth/RLS · pgmq/pg_cron/Edge-Function publisher · Gmail/Calendar sync · real cross-account
learning · failure-state machine (one graceful fallback only) · everything in PRD §12.

---

## 10. Risk register

| # | Risk | Mitigation |
|---|---|---|
| R1 | Live generation slow/flaky on stage | Sonnet @ medium, 8–12 posts, streamed; pre-warm; cached golden payload swap-in; backup video |
| R2 | `src/*.jsx` don't exist → scaffold eats sprint | First H1 task; build to seed so screens render early; timebox per surface |
| R3 | Chat structured-diff malformed | Strict tool schema, validate server-side; fall back to full single-post replace; **single intent only** for demo |
| R4 | Real OAuth/publishing impossible in 2 days | Mock all; flag platform constraints as drawer **copy**, not behavior |
| R5 | Attribution gap (#9) weakens analytics story | Seed the curve; name attribution as the #1 v1 build; don't fake a mechanism |
| R6 | Integration crunch in H3 | **Freeze the §1 contract at H1**; use seed as the frontend↔service interface |
| R7 | Image-gen rabbit hole | IG single-image off critical path; templated placeholder |
| R8 | Scope creep into deferred surfaces | Hard-cut: anything off the 9-step path is out |

---

## 11. Definition of done (demo)

In one uninterrupted run on the presenter's machine: (1) onboarding → Dashboard; (2) a **real Claude
call** generates a campaign across 4 channels, persisted in Supabase, Calendar renders every post
(TikTok as placeholders); (3) a text post shows preview + rationale, and a **NL chat instruction
produces a previewed change that updates the post live on confirm**; (4) Approve/Approve-all flips
status with a mock-publish confirmation, no errors; (5) Analytics Recap shows verdict + chart + format
table + ranked recs; (6) a rec lands in a **pre-filled Builder**; (7) the path runs **3× without manual
DB fixes** and a **backup recording exists**.

---

## 12. Open questions still owned by a human (from PRD §13)

Resolved-for-demo here, but **real v1 must decide**: **#9 conversion attribution** (the largest gap —
UTM where allowed + Offload snippet + self-report); **#10 write-OAuth timing** (recommend read-only at
onboarding, write at first publish, manual-post fallback); **#5 first-campaign defaults** (2w / ~35 /
balanced — confirm); **#6 "Approve all" scope** (resolved here: pending posts in current channel filter).

---

## 13. What real v1 adds beyond the demo

Real magic-link Auth + RLS + Vault-encrypted tokens · the pgmq/pg_cron publisher with retry/stall
handling · real per-channel OAuth (Meta App Review + TikTok audit started day 1) · real §7.1 research +
own-history ingestion · a real per-account + cross-account learning store · conversion attribution ·
the real chat instruction engine (calendar-wide ops) · settings/approval-policy screens · notifications
(Gmail) · accessibility/responsive/error-boundary passes. Everything mocked above is a **swap-in behind
an existing interface, not a rewrite.**

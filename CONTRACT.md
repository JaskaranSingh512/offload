# CONTRACT.md — Offload data contract (FROZEN, Phase 0; auth amendment 2026-06-27)

> **This is the authority.** The SQL migration (`0001_init`), the generated TypeScript types
> (`src/types/database.types.ts`), the typed data layer (`src/lib/api.ts`), the AI Route Handlers
> (`/api/generate`, `/api/chat-edit`, `/api/analyze`), and the seed (`supabase/seed.sql`) all conform
> to **this** document. It pins five things: the table list + tenant key, the two-column post-status
> model, the five `posts.content` shapes + the `founder_scripts` row shape, the three term definitions,
> and the video content model. Generated TS types are produced **from** the schema (Phase 3) but the
> table/column/status model here is the source of truth and does not drift.
>
> Frozen 2026-06-27 per `EXECUTION_PLAN.md` §1 + §0.5. Do not write SQL or TSX until this passes its gate.
>
> **AMENDED 2026-06-27 — GitHub auth is in.** The demo now ships **Supabase Auth + GitHub OAuth** and
> **per-user accounts** (`account_id = auth.uid()`, RLS ON). The old "no-auth, single hardcoded
> `account_id`, RLS off" model is retired. See **§1a** for the new tenant/auth model. Everything else in
> this contract (the 13 tables, the two-column post-status model, the content shapes, the term defs) is
> unchanged.

---

## 1. Tables, tenant key, status model

### 1a. Tenant key & auth (amended 2026-06-27 — GitHub auth is in)

- **Tenant key is `account_id` everywhere.** One account = one founder = one brand in v1.
- **Login = Supabase Auth, GitHub OAuth provider.** Each authenticated GitHub user maps to exactly one
  account: **`accounts.id` equals that user's `auth.users.id`**, so **`account_id = auth.uid()`** holds
  throughout. Accounts are **per-user** (true multi-tenant) — the old hardcoded Brew Lab literal
  `00000000-0000-0000-0000-00000b1e51ab` is **retired** (it was stale frontend scaffolding, not real data).
- **Provisioning:** a `handle_new_user` trigger on `auth.users` INSERT creates the matching
  `public.accounts` row (`id := new.id`). Onboarding then `upsert`s the `brands` row for that account
  (on conflict `account_id`).
- **RLS is ON.** Every account-scoped table carries:
  - a **write** policy (INSERT/UPDATE/DELETE) `account_id = auth.uid()` — you only mutate your own rows;
  - a **read** policy (SELECT) `account_id = auth.uid() OR account_id = <DEMO_ACCOUNT_ID>` — you read your
    own rows **plus** the public **showcase** account (read-only; nobody can write the showcase).
  `cross_account_aggregates` is **global**: RLS on with a read-only `select` policy for any authenticated
  user (no per-account scoping — it holds cross-account benchmark rows).
- **Showcase account (seed/demo, chosen 2026-06-27):** the Brew Lab seed data lives under a single fixed
  **`DEMO_ACCOUNT_ID = 00000000-0000-0000-0000-00000b1e51ab`** (the old literal returns, now as the
  showcase id — **not** a per-user tenant key). It is a free-standing `accounts` row (no backing
  `auth.users` row; `accounts.id` is a plain uuid PK, **not** FK to `auth.users`). Every authenticated
  founder sees the showcase data alongside their own (empty until they onboard) account. Exposed to the
  client as `NEXT_PUBLIC_DEMO_ACCOUNT_ID` so the UI can render the showcase before the user has data.
- **Keys:** the browser uses the **anon/publishable** key **with the logged-in user's session** so
  `auth.uid()` resolves under RLS; Route Handlers use the **secret/service** key to bypass RLS for
  server-side writes (e.g. `/api/generate` inserting posts).
- **Provisioning recap:** `handle_new_user` trigger inserts `accounts(id := new.id)` on `auth.users`
  INSERT for real GitHub sign-ins; the showcase account is seeded directly. No hardcoded per-user
  `account_id` — a real user's account id is their `auth.uid()`.

### 1b. The 13 tables (plural names)

All table names are **plural**. The full frozen list (13 tables):

1. `accounts`
2. `brands`
3. `brand_assets`
4. `social_accounts`
5. `campaigns`
6. `posts`
7. `founder_scripts`
8. `post_metrics`
9. `tracked_links`
10. `conversions`
11. `suggestions`
12. `notifications`
13. `cross_account_aggregates`

Tenant scoping: every table is `account_id`-scoped **except** `cross_account_aggregates`, which is global
(cross-account benchmark rows, seeded).

#### `brands` — extended for the "brand doc → channel strategy" feature (§0.5)

`brands.account_id` is the **PRIMARY KEY** (one brand per account). In addition to the base brand columns
(`name`, `one_liner`, `domain`, `colors`, `voice`, `audience`, `goal`), the `brands` row carries the
brand-doc + AI-recommendation columns folded in from the 12-Hour MVP. **No new table** — the MVP's
`projects` concept collapses into this account-scoped `brands` row:

| Column | Type | Meaning |
|---|---|---|
| `doc_name` | `text` | filename of the uploaded brand doc (`.md`/`.txt` only) |
| `doc_text` | `text` | extracted plaintext of the brand doc (read server-side by `/api/analyze`) |
| `industry` | `text` | industry inferred by `/api/analyze` (e.g. "fitness", "B2B SaaS") |
| `recommended_channels` | `text[]` | the channel(s) the AI recommends leading with (subset of the 4) |
| `channel_rationale` | `text` | one-paragraph "why these channels" explanation |

The recommendation **pre-selects** channels in onboarding; it never restricts — the founder can still run
all 4. The "4 channels only" constraint is intact. **Onboarding writes the brand with `upsert` on
`account_id`** (the seed already inserts a Brew Lab `brands` row, so a plain insert would conflict).

### 1c. Post state is **two columns** (the part everyone gets wrong)

`posts` carries post lifecycle in **two independent columns**, never collapsed into one:

- **`posts.status`** (enum `post_status_t`): `draft | scheduled | published | needs_attention | stalled`
- **`posts.approval_state`** (enum `approval_t`): `pending | approved | rejected`

Rules:

- The PRD's "**scheduled (pending approval)**" = `status='scheduled'` **AND** `approval_state='pending'`.
- **Approve** sets `approval_state='approved'` — it does **NOT** touch `status` (it does not set
  `status='scheduled'`).
- The (mock) **publisher selects**:
  `status='scheduled' AND approval_state='approved' AND scheduled_at <= now() AND channel IN ('reddit','x','instagram')`.
  (Video channels never enter the publish query — see §5.)
- `posts` orders by **`scheduled_at`** (not `schedule`). `src/lib/api.ts` uses the plural tables + these
  exact column names. With generated types, a wrong column name is a **compile error** — lean on it.

---

## 2. The two status enums (verbatim)

```text
post_status_t  (posts.status)          : draft | scheduled | published | needs_attention | stalled
approval_t     (posts.approval_state)  : pending | approved | rejected
```

(Supporting enums also defined in the schema — `voice_t`, `goal_t`, `provider_t`, `freq_t`,
`camp_status_t`, `format_t`, `sa_status_t` — but the **two post-status enums above** are the ones the
contract pins, because the two-column model is the easy thing to get wrong.)

`format_t` (the discriminator for the content shapes in §3):
`reddit_text | x_post | x_thread | ig_carousel | ig_single | tiktok_script | founder_script`.

---

## 3. Content shapes — five `posts.content` shapes + the `founder_scripts` row shape

`posts.content` is JSONB, keyed on `posts.format`. There are **five** distinct content shapes (`reddit_text`
and `x_post` share the same shape):

```jsonc
// posts.content (five JSONB shapes, keyed on posts.format):
reddit_text  | x_post : { "title": "...", "body": "..." }
x_thread             : { "tweets": ["...", "..."] }
ig_carousel          : { "slides": [{ "heading": "...", "sub": "..." }], "caption": "..." }  // text layer only
ig_single            : { "caption": "...", "image_prompt": "...", "image_path": "brand-assets/<acct>/generated/..." }
tiktok_script        : { "hook": "...", "scenes": ["..."], "shot_note": "...", "duration_sec": 30 }

// the founder_scripts row shape (one per VIDEO post — see §5):
founder_scripts row  : { angle, hook, beats[], shot_note, duration_sec, filmed }
```

Notes:

- **Both video formats (`tiktok_script` and `founder_script`) get a `founder_scripts` row** so either can
  be marked filmed.
- For `founder_script` posts, `posts.content` may be `{}` — the script lives entirely in the
  `founder_scripts` row.
- For `tiktok_script` posts, `posts.content` holds the scene shape above **and** a sibling
  `founder_scripts` row tracks `filmed`.
- Define a discriminated-union TS type **`PostContent`** (keyed on `format`, the five `posts.content`
  shapes) in `src/types/content.ts`, so the drawer and the chat-edit patch are both type-checked against
  these shapes. `/api/chat-edit` returns a **patch over this same shape**, so "apply" goes through the
  exact same React Query mutation the drawer uses.

---

## 4. The three term definitions (block Analytics + Approve-all)

- **forecast** = `frequency × duration × per-channel best-time impression heuristic`. Stored on
  `campaigns.forecast` JSONB as `{ impressions, signups }`. It is the Dashboard "forecast vs actual"
  baseline.
- **engagement_rate** = `engagements / impressions` (per post; aggregate by sum/sum).
- **"Approve all"** scope = posts with `status='scheduled' AND approval_state='pending'` **in the current
  calendar channel filter**. Scoping to `status='scheduled'` guarantees Approve-all can never sweep
  founder-posted video drafts (which sit at `status='draft'` until filmed — see §5).

---

## 5. Video content model (PRD open question #11)

- **`founder_script`** (talking-head) = the **Founder Scripts surface** (`scripts/page.tsx`) content.
- **`tiktok_script`** (scene-by-scene) = the **TikTok channel's** content.
- **Every video post of either format has its own `founder_scripts` row** carrying `filmed`.
- Both formats gate calendar activation on `filmed=true`; **neither** enters the publish query — the
  founder posts video manually. Offload tracks `filmed` only.
- `getScripts` / `markFilmed` are scoped to **both** formats (join `posts.format IN ('tiktok_script',
  'founder_script')`), so both can be marked filmed.
- **`markFilmed`** flips the `founder_scripts.filmed` flag **and** transitions the post
  `status` `draft → scheduled` so the calendar placeholder activates.

---

## 6. Verification gate (Phase 0)

```bash
test -f CONTRACT.md && grep -q "approval_state" CONTRACT.md && grep -q "account_id" CONTRACT.md
```

Must exit 0, **and** the doc contains: the 13-table list, both status enums, the five `posts.content`
shapes + the `founder_scripts` shape, and the three term definitions. ✅ (all present above).

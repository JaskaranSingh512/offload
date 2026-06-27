# Offload — 12-Hour MVP (re-scoped for hackathon)

This is the **realistic build plan for one person + AI in 12 hours**. It replaces the
ambitious scope in `PRD.md` / `EXECUTION_PLAN.md` (keep those as the "full vision"
reference — they describe a multi-day team build, not this).

> **The one rule:** anything that needs weeks of external approval (Meta/TikTok app
> review) is **faked in the demo**. We build the parts that are real *and* impressive:
> GitHub login, doc → AI strategy, and AI-generated Canva slideshows.

---

## The flow we are actually building

```
1. Sign up with GitHub        → real (Supabase Auth GitHub provider)
2. Connect socials            → mocked (one click flips status = "connected")
3. Upload a PRD / design doc  → real (file upload + text extraction)
4. AI picks the best platform → real (Claude reads the doc, returns industry + channel + why)
5. AI writes a slideshow      → real (Claude writes 4–6 slides of copy)
6. Canva renders the slideshow→ real (Canva API/MCP generates + exports the design)
7. "Post" it                  → mocked (preview + "Posted to X ✓" toast + download the assets)
```

Steps 1, 3, 4, 5, 6 are genuinely real and demoable. Steps 2 and 7 are honest mocks —
the founder can download the slideshow and post it themselves (real OAuth posting is a
post-hackathon item; it cannot pass platform review in time).

---

## Stack (kept deliberately small)

| Piece | Choice | Why |
|---|---|---|
| App | **Vite + React (JSX)** | matches CLAUDE.md, fast to scaffold |
| Auth + DB + storage | **Supabase** | GitHub OAuth in one toggle; one DB; file storage |
| AI | **Claude API** (`claude-opus-4-8` or `claude-sonnet-4-6`) | doc → strategy + slide copy |
| Slideshow render | **Canva API** (Canva MCP is already connected) | turns slide copy into a real design + PNG/PDF export |
| Server | **one tiny Node/Express process** | holds the Claude + Canva keys; the browser never sees secrets |

No Zustand, no TanStack Query, no Recharts, no mock/live seam, no 13-file prototype
unless time allows. Plain React state + `fetch`. Add libraries only if they save time.

---

## Data model (3 tables — that's it)

```sql
-- user identity comes from Supabase Auth (auth.users); we just reference its id.

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  doc_name text,
  doc_text text,                    -- extracted text from the uploaded PRD/design doc
  industry text,                    -- AI-inferred
  best_channel text,                -- AI-inferred: 'instagram' | 'tiktok' | 'reddit' | 'x' | 'linkedin'
  channel_reason text,              -- AI's one-paragraph "why this platform"
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  slides jsonb,                     -- [{ "heading": "...", "body": "..." }]
  caption text,
  canva_design_id text,             -- returned by Canva
  canva_export_url text,            -- exported PNG/PDF link
  status text default 'draft',      -- 'draft' | 'posted' (mock)
  created_at timestamptz default now()
);

create table social_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  provider text,                    -- 'instagram' | 'tiktok' | etc.
  status text default 'disconnected'-- flipped to 'connected' by the mock connect button
);
```

No RLS for the demo (single-user-at-a-time). Add it later if it's quick.

---

## Build order (12 hours, rough)

**Hours 0–2 — Foundation**
- Scaffold Vite React app + tiny Express server (`/api/analyze`, `/api/slideshow`).
- Supabase project: enable **GitHub provider** (needs a GitHub OAuth app — 5 min), run the
  3-table SQL, create a `docs` storage bucket.
- Get login → logged-in shell working end to end first. Don't move on until login works.

**Hours 2–4 — Upload + AI strategy**
- Upload screen: drop a `.md`/`.txt`/`.pdf`, extract text (PDFs: `pdf-parse` or just accept
  `.md`/`.txt` first), save a `projects` row.
- `/api/analyze`: Claude reads `doc_text`, returns `{ industry, best_channel, channel_reason }`
  via a strict tool/JSON schema. Show it on screen ("We'd run this on **Instagram** because…").

**Hours 4–8 — The slideshow (the wow moment)**
- `/api/slideshow`: Claude writes 4–6 slides `[{heading, body}]` + a caption, tailored to the
  industry and chosen channel.
- Feed that into **Canva** (via the connected Canva MCP / Connect API): generate a design from
  the slide copy, export to PNG/PDF, store the URL on the `posts` row.
- Render the exported slideshow in the app.

**Hours 8–10 — Connect + post (mocks) + polish**
- "Connect socials" screen: buttons that flip `social_connections.status='connected'`.
- "Post" button: status → `posted`, toast "Posted to Instagram ✓", offer asset download.
- Visual pass using the design language; make the slideshow preview look good.

**Hours 10–12 — Buffer + demo run**
- Run the whole path 3×. Pre-load a sample PRD so the demo can't stall.
- Record a backup screen recording of the golden run.

---

## What's real vs. faked (be honest in the demo)

- **Real:** GitHub login, doc upload + extraction, AI industry/channel pick, AI slide copy,
  Canva-rendered slideshow + export.
- **Faked:** social OAuth ("connected" flag), the actual publish (toast + download instead).
  Reason: IG/TikTok publishing needs multi-week app review. The founder downloads and posts.

---

## Decisions to confirm before building

1. **Canva path** — use the already-connected **Canva MCP** for design generation, or call the
   Canva Connect REST API directly from the Node server? (MCP is faster to start; REST is what
   ships long-term.)
2. **Doc formats** — start with `.md`/`.txt` only (zero parsing risk) and add `.pdf` if time?
3. **One platform vs. show all four** — the original scope was 4 channels. New scope picks the
   single best one. Confirm we're going single-platform for the MVP.
4. **CLAUDE.md / PRD divergence** — current project docs say "4 channels, no Canva, video is
   founder-posted." This MVP changes that. After review, update CLAUDE.md + PRD to match, or
   keep them as the long-term vision and treat this doc as the hackathon override.
```

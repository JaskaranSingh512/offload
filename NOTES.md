# NOTES — edit/overwrite freely, keep it short.

## What works
- **Frontend is built and scaffolded** (branch `feat/frontend-tether`). Next.js 16 App Router
  app ported 1:1 from the `UI for offload/` React prototype ("Tether"): onboarding flow +
  5 screens (Dashboard, Calendar, Campaign Builder, Scripts, Analytics) + content-detail drawer.
  All client-side state routing in `app/page.tsx`. Mock data in `lib/data.tsx`.
- `./verify.sh` passes (typecheck + lint + `vitest`) and `next build` is green.
- `npm run dev` serves at :3000; onboarding SSRs correctly.

## Stack (locked)
- Next.js 16 (App Router) + TypeScript + Tailwind v4, deployed on Vercel. Supabase backend.
- AI endpoints (`/api/generate`, `/api/chat-edit`) = Next.js Route Handlers (no Express).
- **Design system note:** the visual design is a bespoke hand-rolled CSS system (ported verbatim
  to `app/globals.css` from the prototype's `styles.css`), NOT shadcn/ui. Tailwind v4 is wired up
  for any future components, but screens use the prototype's own classes for pixel fidelity.
  This supersedes the earlier "build from PRD §5/§6, no JSX prototype" plan — we now have the
  prototype and the user asked to build directly from it.

## What's next
- **Read EXECUTION_PLAN.md** — it's now a runbook for an autonomous coding agent (Claude Code), ordered
  Phase 0..8 with exact non-interactive commands, file paths, and a per-phase Verification gate.
- Phase 0 FIRST: freeze the data contract (`CONTRACT.md`: plural tables, `account_id`, two-column post
  status, content JSONB shapes) before any code.
- Then: Phase 1 services (Supabase + MCP, Anthropic key, Vercel) → Phase 2 scaffold → Phase 3 schema +
  types + seed → Phase 4 surfaces → Phase 5 AI Route Handlers → Phase 6 OAuth/publish mock → Phase 7
  integrate + deploy → Phase 8 Playwright e2e + PR.
- `package.json` scripts `typecheck` / `lint` (eslint) / `test` turn on `verify.sh`.

## Gotchas
- 4 channels only (Reddit, TikTok, Instagram, X). Video is founder-posted, never auto-published.
- Live demo runs from the deployed Vercel URL — engineer around serverless cold-start/timeout with a
  cached golden-payload fallback.
- Nothing built yet. Repo has docs only; app not scaffolded.

## What's next
- **Read MVP_12H.md** — the re-scoped 12-hour hackathon build plan. This is the plan we're
  actually executing.
- `PRD.md` / `EXECUTION_PLAN.md` are the bigger "full vision" — reference only, not the 12h build.
- New scope: GitHub login → connect socials (mock) → upload PRD → AI picks best platform →
  AI writes slides → Canva renders slideshow → "post" (mock + download).

## Gotchas
- Real social posting (IG/TikTok) can't pass platform review in the timebox — it's mocked.
- New MVP diverges from CLAUDE.md/PRD (single best channel + Canva). Decide post-review whether
  to update those docs or keep them as long-term vision.
```

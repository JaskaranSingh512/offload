# NOTES — edit/overwrite freely, keep it short.

## What works
- Nothing built yet. Repo has PRD.md + EXECUTION_PLAN.md only; app not scaffolded.

## Stack (locked)
- Next.js 16 (App Router) + TypeScript + shadcn/ui + Tailwind v4, deployed on Vercel.
- Supabase backend. AI endpoints (`/api/generate`, `/api/chat-edit`) = Next.js Route Handlers (no Express).
- Build directly in TSX from PRD §5/§6 — no JSX prototype.

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

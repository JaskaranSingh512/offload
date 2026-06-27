# Offload

**Marketing autopilot for solo founders.** Tell Offload about your brand once in a
~3-minute onboarding, and it researches your market, drafts a multi-channel campaign
(Reddit, TikTok, Instagram, X), schedules and publishes on your behalf, and reports
what's working with a recommended next move. You stay in control via approval gates,
but the default is the work moves forward without you.

> Positioning: not *"a tool that helps you market"* — *"a system you offload your
> marketing to."*

## Status

Early — hackathon sprint. The app is not scaffolded yet; the repo currently holds the
product spec and build plan. Stack will be **React + Vite (JSX)** frontend, **Supabase**
backend, and **Claude** for content generation.

## Docs

| File | What it is |
|------|------------|
| [`PRD.md`](PRD.md) | Product requirements — the source of truth for scope and behavior |
| [`EXECUTION_PLAN.md`](EXECUTION_PLAN.md) | Start-to-finish build plan: MCPs/services, schema, frontend, AI pipeline, sprint sequence |
| [`CLAUDE.md`](CLAUDE.md) | Short map for working in this repo + workflow rules |
| [`NOTES.md`](NOTES.md) | Running scratchpad: what works · what's next · gotchas |

## Working in this repo

- Read `NOTES.md` first for current state.
- All changes go on a **feature branch + PR** — never commit directly to `main`.
- Run `./verify.sh` after changes (typecheck + lint + test; fails open until the app is scaffolded).

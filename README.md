# Offload

**Marketing autopilot for solo founders.** Tell Offload about your brand once in a
~3-minute onboarding, and it researches your market, drafts a multi-channel campaign
(Reddit, TikTok, Instagram, X), schedules and publishes on your behalf, and reports
what's working with a recommended next move. You stay in control via approval gates,
but the default is the work moves forward without you.

> Positioning: not *"a tool that helps you market"* — *"a system you offload your
> marketing to."*

## Status

The frontend is built. It's a **Next.js 16 (App Router) + TypeScript + Tailwind v4**
app, deployed-ready for Vercel, with a **Supabase** backend planned and **Claude** for
content generation. The UI is mock-data-driven today (the "Brew Lab" cold-brew demo
persona); the live data + AI layer is the next phase.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000 — first run redirects to /onboarding
```

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm run test       # vitest
./verify.sh        # typecheck + lint + test in one shot
```

## Surfaces (routes)

| Route | Surface |
|-------|---------|
| `/onboarding` | 6-step setup: brand, assets, audience/goals, channels, connect accounts, generate |
| `/` | Dashboard — active campaign, KPIs, what's next, AI suggestions |
| `/calendar` | Content calendar — review / approve / schedule across channels |
| `/build` | Campaign builder — brief and generate a new campaign |
| `/scripts` | Founder scripts — talking-head scripts to film yourself |
| `/analytics` | In-flight + recap analytics with ranked next-move recommendations |
| `/settings` | Per-channel approval policy, notifications, connected accounts |

A persistent **chat launcher** (instruction layer over the UI) and a **format-aware
content drawer** are available across the app.

## Structure

```
app/
  (shell)/            app shell layout + the 7 in-app routes
  onboarding/         standalone onboarding flow
  layout.tsx          fonts, globals, providers
components/           screens, drawer, chat, sidebar, logo, icons
lib/
  data.tsx            typed mock data (Brew Lab demo)
  store.ts            Zustand UI store (overlays)
api/  supabase/       backend stubs (separate phase)
```

## Docs

| File | What it is |
|------|------------|
| [`PRD.md`](PRD.md) | Product requirements — the source of truth for scope and behavior |
| [`EXECUTION_PLAN.md`](EXECUTION_PLAN.md) | Start-to-finish build plan: services, schema, frontend, AI pipeline, sequence |
| [`CLAUDE.md`](CLAUDE.md) | Short map for working in this repo + workflow rules |
| [`NOTES.md`](NOTES.md) | Running scratchpad: what works · what's next · gotchas |

## Working in this repo

- Read `NOTES.md` first for current state.
- All changes go on a **feature branch + PR** — never commit directly to `main`.
- Run `./verify.sh` after changes (typecheck + lint + test).

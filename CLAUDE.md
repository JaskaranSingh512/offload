# Offload

Marketing autopilot for solo founders: a ~3-min onboarding, then it researches
the market, drafts a 2-week multi-channel campaign (Reddit, TikTok, Instagram, X),
schedules/publishes on the founder's behalf, and reports what worked. The founder
stays in control via per-channel approval gates, but the default is the work moves
forward. Stack: React + JSX + CSS (the `src/*.jsx` design-handoff bundle is the
canonical prototype for layout, copy, and interaction). App is not scaffolded yet.

**Read NOTES.md first** for current state.

See `PRD.md` for full scope — it is the source of truth. Don't restate it here.
The prototype files (`src/*.jsx`, `src/styles.css`) are canonical for all visuals.

## Workflow

All changes go on a **feature branch + PR** — never commit directly to `main`.
Branch from `main` (e.g. `git checkout -b feat/x` or `docs/x`), push, open a PR.

## Checking work

Run `./verify.sh` after changes (typecheck + lint + test). It fails open until
the app is scaffolded with matching npm scripts.

## Constraints (the demo depends on these staying true)

- 4 channels only: Reddit, TikTok, Instagram, X. No others in v1.
- TikTok/video is founder-posted — Offload never auto-publishes video.
- Default approval policy is "approve each" per channel; "scheduled" ≠ "published".
- Visual design comes from the `src/*.jsx` prototype, not invented from scratch.

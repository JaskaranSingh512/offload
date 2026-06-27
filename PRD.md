# Offload — Product Requirements Document (v1)

**Status:** Draft (revised) · **Last updated:** 2026-06-04
**Source of truth for visual design:** `/src/*.jsx` and `/src/styles.css` (Claude Design handoff bundle). The prototype is canonical for layout, copy, typography, and interaction — this PRD describes behavior, scope, and non-visual decisions.

---

## 0. Revision notes

This revision tightens ambiguities found in the v1 draft. Most edits are clarifications, not scope changes. Items still requiring a human decision are flagged inline with a `> **DECISION NEEDED**` callout and tracked in §13.

- Resolved "scheduled" to consistently mean _drafted + placed on the calendar, pending per-channel approval_ (matches the v1 approve-each default in §7.4). See §3, §5.4, §7.3.
- Made the Content Detail drawer action set format-aware so it matches the generation/editing model in §7.2 (§5.4).
- Clarified that **all TikTok/founder-filmed video is founder-posted in v1** — Offload never auto-publishes video; "scheduled" for video means a calendar placeholder + filming reminder (§7.3, §7.4).
- Tagged the first-campaign defaults (§5.2) and "Approve all" behavior (§6.2) as provisional, pointing to their open questions, so the body no longer asserts as settled what §13 lists as undecided.
- Renamed the "Week-2 retention" metric to "Post-campaign retention" (a 2-week campaign ends ~week 3, so the old name didn't match its own definition) and aligned the time-to-first-campaign milestone wording across §3 and §4.
- Added open questions to §13: conversion attribution (the largest gap), publish/write-scope OAuth timing, the TikTok-vs-Founder-Scripts content model, and definitions for "forecast", the frequency presets, and "engagement rate."

---

## 1. Overview

Offload is a marketing autopilot for solo founders. The founder tells Offload about their brand once during a ~3-minute onboarding. Offload then:

1. Researches the founder's market (competitors, audience signals, proven hooks)
2. Drafts a multi-channel campaign (Reddit, TikTok, Instagram, X)
3. Schedules and publishes the campaign on the founder's behalf
4. Reports what's working and recommends the next move

The product is positioned as the difference between _"a tool that helps you market"_ and _"a system you offload your marketing to."_ The founder stays in control via approval gates, but the default state is the work moves forward without them.

---

## 2. Problem & Audience

### Primary user

**Solo founders / indie operators** running small DTC brands, SaaS products, or creator businesses. They wear every hat. They know marketing matters but it's the work that gets pushed to the bottom of the list because:

- Generating ideas from a blank page is slow
- Each channel has its own native format and rhythm
- Keeping a consistent voice across channels is hard
- Measuring what worked and adapting is a separate skill set

The prototype's `Brew Lab` persona — a small-batch cold brew brand — is the canonical user for design and copy decisions.

### Out of scope for v1

- SMB marketing managers with teams
- Agencies managing multiple client brands
- Enterprise / compliance-heavy verticals

These may become target users in later versions, but every v1 product decision should optimize for the solo founder.

---

## 3. Goals & Non-goals

### Goals

- Founder can go from "I signed up" to "I have a 2-week campaign drafted and placed on the calendar across 4 channels" in under 5 minutes (posts then publish per the approval policy in §7.4)
- Founder can run a campaign end-to-end without writing any post copy themselves
- Founder gets a clear, opinionated post-campaign verdict and a recommended next move
- The product feels like an autopilot, not a content tool

### Non-goals (v1)

- Multi-brand workspaces / agency mode (deferred)
- Team/seat invites (deferred)
- Pricing / billing infrastructure (deferred — see §13)
- TikTok video post-production (Offload writes the script; the founder films, edits, and posts themselves)
- Paid ad spend management (organic only)
- LinkedIn, YouTube, Pinterest, Threads (4 channels only: Reddit, TikTok, Instagram, X)

---

## 4. Success Metrics

| Metric                   | Definition                                                                               | Target       |
| ------------------------ | ---------------------------------------------------------------------------------------- | ------------ |
| Activation rate          | % of signups who complete onboarding and generate their first campaign                   | 70%+         |
| Publish rate             | % of generated posts that get approved and published (vs. deleted or stuck in drafts)    | 60%+         |
| Post-campaign retention  | % of users who return after their first campaign ends to brief a second                  | 40%+         |
| Time-to-first-campaign   | Median time from signup to first campaign generated (drafted and placed on the calendar) | ≤ 5 min      |
| Self-reported time saved | Survey response on time saved per week vs. doing marketing manually                      | ≥ 5 hrs/week |

> **DECISION NEEDED — conversion attribution mechanism (largest open gap).** "signups (7d)" and "orders" appear as headline outcomes here and on the Dashboard, but the content pipeline (§7) only ingests social _engagement_ signals (impressions, followers, engagement rate). Nothing currently ties a signup or order back to a specific organic post — and on TikTok/Instagram, outbound links are restricted in most post types, so this is non-trivial. A mechanism must be chosen (UTM links where the platform allows / a Offload site snippet / platform-native analytics / founder self-report). This underpins §4, the Dashboard, Analytics, and the entire learning loop. Tracked as Open Question #9.

---

## 5. Core User Flows

### 5.1 Onboarding (first run only)

Source: `src/onboarding.jsx`

Five steps, ~3 minutes:

1. **Welcome** — value prop, "Get started"
2. **Brand** — logo upload, brand name, one-line description, brand colors (pre-filled from domain when possible), brand voice (warm-witty / authoritative / playful / editorial)
3. **Audience & Goals** — free-text audience description; primary goal (awareness / orders / community / launch)
4. **Channels** — toggles for Reddit, TikTok, Instagram, X
5. **Loading** — Offload builds the first campaign (~30 seconds in production; ~3 seconds in prototype)

**New for v1 beyond the prototype** (must be wired in):

- **Read-only OAuth to existing social handles** — added as a step inside or just after Channels. Offload uses these handles to (a) pull historical post data for personalization and (b) authenticate later for publishing.
- **Brand asset upload** — added inside or after Brand. Logos, product photos, fonts. Used to compose carousels and overlays without raw image gen drift.

The prototype's "channel connections are simulated" notice is replaced with real OAuth.

> **DECISION NEEDED — when is _publishing_ (write) access granted?** Onboarding describes read-only OAuth, but publishing (§7.4) needs write scopes on enabled channels. The doc doesn't say whether the write grant happens during onboarding or at first-publish time. This matters because the headline promise — a campaign ready to publish by end of onboarding — only holds if write access exists on day one. Also define the fallback when a founder grants read-only but not write. Tracked as Open Question #10 (related to #8).

### 5.2 First-campaign generation (end of onboarding)

After step 5, Offload produces a default 2-week, ~35-post campaign _(provisional defaults — exact duration, frequency, and post count pending Open Question #5)_ and drops the user on the Dashboard. The first campaign is opinionated by design — the founder did not specify duration, frequency, or post counts. Offload picks reasonable defaults based on the goal and channels selected.

### 5.3 Ongoing loop (post-first-campaign)

```
Dashboard → see campaign progress + AI suggestions
   ↓
Calendar → review/approve/edit posts
   ↓
[posts publish on schedule]
   ↓
Analytics → see what worked, get next-move recommendation
   ↓
New Campaign → brief next one (informed by what worked last time)
```

### 5.4 Per-post review (Content Detail drawer)

Source: `src/content-detail.jsx`

Opened from Dashboard "Next up" or Calendar. Shows channel-native preview, scheduled time, and AI rationale ("Why Offload wrote this"). Actions are **format-aware**, matching the generation/editing model in §7.2:

- **All formats:** Reschedule, Delete, Approve
- **Reddit & X (text):** inline copy edit
- **Instagram carousel:** inline edit of the **text layer only** — layout/visual is templated and not editable (see §7.2)
- **Instagram single-image / photo-style:** inline caption edit **+ prompt-based image regenerate** (describe the change, Offload re-runs the image model)
- **TikTok & Founder Scripts (video):** inline script edit **+ "Mark filmed"** — no publish action; video is founder-posted in v1 (see §6.4)

---

## 6. Surface-by-Surface Requirements

The five main surfaces match the sidebar in `src/sidebar.jsx`.

### 6.1 Dashboard (`src/dashboard.jsx`)

- KPI row: impressions (7d), signups (7d), engagement rate, posts scheduled
- Active campaign hero card: name, dates, % complete, next post time, forecast
- "Next up" list: today + tomorrow's posts, clickable to open Content Detail drawer
- 7-day signups trend chart
- Channel breakdown bars (posts per channel)
- **AI suggestions card** — surfaces performance-spike follow-ups (see §8.2). Dismissible.

### 6.2 Content Calendar (`src/calendar.jsx`)

- 2-week grid view (or matching the active campaign's duration)
- Channel filter chips: All + per-channel
- Per-post tile: channel icon, time, title, format type
- Today highlighted
- Click any post to open Content Detail drawer
- Top actions: Filters, Add post, **Approve all** (bulk-approve pending posts — _exact scope provisional: current view vs. whole campaign, see Open Question #6_)

### 6.3 Campaign Builder (`src/campaign-builder.jsx`)

- Campaign name
- Goal (awareness / orders / launch / community)
- Duration (1w / 2w / 4w / custom)
- Channel toggles
- Posting frequency (light / balanced / aggressive)
- Live summary card with estimated post count + estimated impressions
- **"Generate campaign"** → loading state → calendar populated

### 6.4 Founder Scripts (`src/scripts.jsx`)

- Grid of talking-head video scripts for the founder to film themselves
- Per-card: angle tag, title, hook, beat-by-beat breakdown, shot note, duration
- Actions per card: Edit, Variations, **Mark filmed**
- **v1 cuts the loop here.** Offload does not ingest filmed footage, does not auto-caption, does not auto-publish video. Founder records, edits, and posts to TikTok themselves. Offload only tracks `filmed: yes/no`.

### 6.5 Analytics (`src/analytics.jsx`)

Two modes:

- **In-flight** (campaign running): live KPIs, daily impressions, channel breakdown, "what's working" themes
- **Recap** (campaign ended): "campaign verdict" hero, 2-week chart, format performance table, ranked "next move" recommendations

The Recap is the moment Offload earns the next campaign brief. Recommendations link directly into the Campaign Builder pre-filled with the suggested approach.

### 6.6 Conversational layer (NEW — not in prototype)

Offload has a chat surface available on every screen — accessed via a persistent UI affordance (exact placement TBD; recommend bottom-right floating launcher consistent with the prototype's visual language).

The user can:

- Ask questions about the campaign or analytics ("why did this post work?")
- Request changes in natural language ("rewrite this post warmer", "add 3 more Reddit posts to week 2", "shift everything one day later")
- Brief work that doesn't fit a form ("write me a thread about our 4am bottling story")

Chat outputs structured changes the user previews and confirms before they're applied. Chat is not a chatbot — it is an instruction layer over the existing UI.

---

## 7. AI & Content Pipeline

### 7.1 Market research (hybrid)

When a campaign is briefed, Offload:

1. **Crawls what's public** — the user's domain (from sign-up), public Reddit communities relevant to the audience, public web search for competitor signals
2. **Uses the OAuth'd social handles** — pulls the user's own historical post performance and follower-graph signals from connected X/Instagram/Reddit accounts (read-only scopes)
3. **Does not require manual competitor input** — Offload infers competitors from domain + audience description. (User can override or add later via the chat layer.)

### 7.2 Content generation

| Format                               | Generation approach                                | Editing model                                                                                                   |
| ------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Reddit long-form                     | LLM text generation                                | Inline copy edit                                                                                                |
| X posts & threads                    | LLM text generation                                | Inline copy edit                                                                                                |
| Instagram carousels                  | LLM text + **SVG/HTML template render** for visual | Inline text edit (visual is templated; text layer is the only editable layer)                                   |
| Instagram single-image / photo-style | LLM caption + image-gen API for the photo          | Caption: inline edit. Image: **prompt-based regenerate** (user describes the change, Offload re-runs the model) |
| TikTok scripts                       | LLM scene-by-scene scripting                       | Inline edit. **No B-roll generation** — user films themselves.                                                  |
| Founder Scripts (talking head)       | LLM script with hook + beats + shot notes          | Inline edit + "Variations"                                                                                      |

> **DECISION NEEDED — the video content model is ambiguous.** This table lists two founder-filmed video formats — "TikTok scripts" (scene-by-scene) and "Founder Scripts" (talking-head, which also has its own surface in §6.4). It's unclear whether these are two distinct things, whether they overlap, and which one _is_ the TikTok channel's content. Resolving this locks in the already-applied downstream fixes (§7.3 scheduling and §7.4 publishing both now state video is founder-posted, not auto-published). Tracked as Open Question #11.

**Why SVG/HTML for carousels:** layout, fonts, colors, and brand structure stay deterministic. Only the text content varies. This makes regeneration cheap, predictable, and on-brand. Image-gen is reserved for cases where a photographic visual is genuinely required.

### 7.3 Scheduling

- Offload picks post times based on (a) general best-time-to-post heuristics per platform and (b) the user's own audience activity once enough signal exists
- Frequency is distributed evenly across the duration
- Founder-filmed video (TikTok / Founder Scripts) gets a **calendar placeholder only**, activated on `filmed: yes`. Unfilmed scripts are held and trigger a filming reminder (see §9). "Scheduled" here means a calendar slot + reminder, **not** a Offload-side publish — the founder posts video themselves in v1.

> **Terminology — "scheduled" vs. "published" in v1.** Because the v1 default approval policy is _approve-each on every channel_ (§7.4), a "scheduled" post has a calendar slot and is queued **pending approval** — it does not publish automatically until the founder approves it. "Published" means it has actually gone out via the OAuth'd connection (or, for video, been posted by the founder). The body uses these terms in this sense throughout.

### 7.4 Publishing

- Approval policy is **configurable per channel** in settings (default: "approve each" on every channel for v1)
- Approved posts publish via the OAuth'd connections at their scheduled time — **except TikTok/video, which is founder-posted in v1** (Offload does not auto-publish video; see §6.4 and §7.2)
- A small number of channels have known platform-specific constraints (e.g., Reddit posting karma thresholds, TikTok API limits). These are flagged in the Content Detail drawer when relevant — they do not block v1 ship but are tracked as risks in §13.

---

## 8. Learning Loop

### 8.1 Per-account learning

Offload tracks for each account:

- Which post angles, formats, post times, and hooks performed best
- Which channels are over-/under-performing forecast
- Which goal-channel combinations convert

These signals feed the next campaign's generation as additional context.

### 8.2 Cross-account learning

Anonymized aggregate signals across all Offload accounts feed a shared model of "what tends to work" by industry, audience type, and goal. This compounds with scale and is part of the product's long-term moat.

**User-facing posture:** disclosed in the Terms of Service. No per-user opt-out toggle in v1. All cross-account data is anonymized and aggregated before use. (See §11 for data handling details.)

### 8.3 Surfacing learning to the user

- **"Offload suggests" card** on the Dashboard — proactive follow-up suggestions when a post outperforms forecast
- **"What's working" panel** in Analytics
- **Ranked next-move recommendations** in the campaign Recap
- Recommendations link directly into a pre-filled Campaign Builder

---

## 9. Notifications

Offload proactively notifies the user (email + in-app) for:

| Trigger                  | Reason                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------- |
| Approval needed          | A post on an "approve each" channel is queued and waiting. Prevents silent campaign stalls. |
| Performance spike        | A post is materially outperforming forecast. Triggers a "want a follow-up?" suggestion.     |
| Campaign milestones      | Mid-campaign check-in, "ending soon," recap ready.                                          |
| Founder filming reminder | One or more unfilmed scripts are blocking the calendar.                                     |

Notification preferences are configurable in settings. Email is opt-out, push is opt-in.

---

## 10. Failure Handling

Default policy: **silent retry + user-visible "stalled" state.**

- Model/API generation failures retry transparently in the background (exponential backoff, up to a bounded number of attempts)
- If a post cannot generate or cannot publish after retries, it appears in the calendar with a "needs attention" state and is excluded from being silently dropped
- The user is _not_ notified proactively for these — they discover the stalled state when they next open the calendar or Dashboard

(Stretch consideration for v1.1: differentiate by failure type — proactive notify for platform-side rejection, silent retry for transient API errors. v1 ships one unified policy.)

---

## 11. Privacy & Data

- **Read-only OAuth scopes** for analytics ingestion; **write scopes** only on channels the user has enabled publishing for
- **Brand assets** (logos, photos) are user-owned and stored per-account; never reused across accounts
- **Cross-account learning** uses only anonymized aggregate signals (performance ratios, engagement rates, format-level outcomes) — never individual post text, never per-user identifying data
- **Data retention** — campaign content and analytics retained for the lifetime of the account; deletion on request removes all per-user data within 30 days
- **ToS** must explicitly disclose the cross-account learning posture (§8.2) at sign-up

---

## 12. v1 Out of Scope (Explicit)

To keep v1 shippable, the following are explicitly deferred:

- Multi-brand workspaces and brand switcher
- Team / seat / role permissions
- Pricing tiers and billing flow
- TikTok post-production (auto-caption, edit, schedule of filmed footage)
- AI-generated TikTok B-roll
- Per-user opt-out toggle for cross-account learning
- Channels beyond Reddit / TikTok / Instagram / X
- Paid-spend management
- Differentiated failure-handling policy per failure type
- A/B testing of post variants
- Cross-campaign content reuse / "evergreen" library

---

## 13. Open Questions / Decisions Deferred to TRD

These are known unknowns surfaced during PRD drafting. They block implementation but not PRD sign-off.

1. **Pricing model** — deliberately deferred. Will be revisited after v1 usage data exists.
2. **Onboarding UX for the new OAuth + brand-kit steps** — exact step placement, what to show when the user skips. Designs do not yet exist; prototype omits these screens.
3. **Chat layer placement & interaction model** — bottom-right launcher? Inline per-screen? Voice? Needs design.
4. **Platform-specific publishing constraints** — Reddit's posting karma requirements (some subreddits block low-karma accounts), Instagram Graph API's restrictions on personal accounts, TikTok's Content Posting API limits. Surface these in onboarding or accept as v1 risk?
5. **First-campaign defaults** — duration (2w?), frequency (balanced?), channel mix when user enables all four. Today the prototype assumes 2w / 35 posts / balanced. Confirm.
6. **What "approve all" actually does** — bulk-approves all pending posts in the calendar. Confirm behavior: approve all in current view? all in campaign? all on screen?
7. **Recommendation acceptance flow** — when the user clicks "Brief next campaign" from Recap, what pre-fills? Just the goal? Goal + channels + a starting brief?
8. **Edge case: founder never connects OAuth** — does Offload still let them generate? (Recommended: yes, with manual-post mode as fallback. Confirm.)
9. **Conversion attribution mechanism** — _(largest open gap; flagged inline in §4.)_ "signups" and "orders" are headline outcomes, but the pipeline only ingests social engagement signals. How does Offload tie a signup/order to a specific organic post, given outbound-link restrictions on TikTok/IG? Options: UTM links where allowed, a Offload site snippet, platform-native analytics, founder self-report. Blocks §4, Dashboard, Analytics, and the learning loop.
10. **Publishing (write) OAuth — timing & fallback** — _(flagged inline in §5.1; related to #8.)_ Is the write-scope grant collected during onboarding or at first publish? The "ready to publish by end of onboarding" promise depends on the answer. Define the read-only-but-not-write fallback.
11. **Video content model — "TikTok scripts" vs. "Founder Scripts"** — _(flagged inline in §7.2.)_ Are these two distinct formats, do they overlap, and which is the TikTok channel's actual content? Resolving this confirms the §7.3/§7.4 video-publishing language.
12. **Undefined terms to pin down (likely TRD-level):**
    - **"forecast"** — drives the hero card, the performance-spike notification, and the builder's "estimated impressions," but is never defined. Forecast of what (impressions? signups?), against what baseline?
    - **Frequency presets** — light / balanced / aggressive have no stated definition (posts per week? per channel?).
    - **"engagement rate"** — used as a Dashboard KPI (§6.1) with no formula (aggregate vs. per-channel? which interactions?).

---

## 14. Appendix: Prototype File Map

For implementation reference, the canonical visuals/copy/interactions live in:

| Surface               | File                       |
| --------------------- | -------------------------- |
| App shell & routing   | `src/app.jsx`              |
| Sidebar nav           | `src/sidebar.jsx`          |
| Onboarding            | `src/onboarding.jsx`       |
| Dashboard             | `src/dashboard.jsx`        |
| Calendar              | `src/calendar.jsx`         |
| Campaign Builder      | `src/campaign-builder.jsx` |
| Founder Scripts       | `src/scripts.jsx`          |
| Analytics             | `src/analytics.jsx`        |
| Content Detail drawer | `src/content-detail.jsx`   |
| Shared UI primitives  | `src/ui.jsx`               |
| Icons                 | `src/icons.jsx`            |
| Mock data (Brew Lab)  | `src/data.jsx`             |
| Styles                | `src/styles.css`           |

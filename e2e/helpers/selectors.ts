// Centralized, brittle text/aria selectors for the demo-path e2e specs.
// Every string here is quoted verbatim from the component JSX so the specs read
// cleanly and there's exactly one place to update when copy changes.
//
// Values are grouped by surface and shaped for direct use with Playwright
// locators: getByRole('button', { name }), getByText, getByLabel, etc.
// Where a locator is clearer than a bare string, a small `(page) => Locator`
// factory is exported instead.

import type { Page, Locator } from "@playwright/test";

// ===== Onboarding wizard (components/onboarding.tsx) =====
// Steps array order: welcome → brand → audience → channels → connect → loading.
// Each non-terminal step advances via a primary button; completion routes to "/".
export const onboarding = {
  steps: ["welcome", "brand", "audience", "channels", "connect", "loading"] as const,

  // Progress header, e.g. "Step 1 of 6".
  stepCounter: (n: number) => `Step ${n} of 6`,

  // 00 · Welcome
  welcomeEyebrow: "Welcome to Offload",
  getStartedBtn: "Get started", // advances welcome → brand

  // 01 · Brand
  brandStepLabel: "01 · Brand",
  // Brand-doc upload <input type="file"> accepts these (used with setInputFiles).
  uploadAccept: ".md,.txt,text/markdown,text/plain",
  uploadLabelNew: "Upload .md / .txt",
  uploadLabelReplace: "Replace doc",
  brandContinueBtn: "Continue", // advances brand → audience (also the audience/channels label)

  // 02 · Audience & Goals
  audienceStepLabel: "02 · Audience & Goals",
  audienceContinueBtn: "Continue", // advances audience → channels

  // 03 · Channels — channel toggles are <Toggle> rows; identify by the channel name.
  channelsStepLabel: "03 · Channels",
  channelNames: ["Reddit", "TikTok", "Instagram", "X"] as const,
  channelsContinueBtn: "Continue", // advances channels → connect

  // 04 · Connect accounts
  connectStepLabel: "04 · Connect accounts",
  connectBtn: "Connect", // per-channel connect button (becomes the "Connected" chip)
  connectedChip: "Connected", // chip-teal shown after a channel connects
  skipBtn: "Skip for now", // only present while nothing is connected
  generateBtn: "Generate my first campaign", // advances connect → loading

  // 05 · Loading — generation streams, then router.push("/").
  loadingTitle: "Building your first campaign",
  completionPath: "/", // where onboarding navigates on complete
} as const;

// ===== Sidebar nav (components/sidebar.tsx) =====
// Nav links are Next <Link> elements rendered as role="link" by their label.
export const nav = {
  dashboard: { label: "Dashboard", href: "/" },
  calendar: { label: "Calendar", href: "/calendar" },
  scripts: { label: "Scripts", href: "/scripts" },
  analytics: { label: "Analytics", href: "/analytics" },
  newCampaign: { label: "New campaign", href: "/build" },

  // Link by href — robust against badge counts baked into the accessible name
  // (Calendar/Scripts render a <span class="nav-badge"> inside the same <Link>, so their
  // accessible names are "Calendar 35" / "Scripts 4" and an exact label match never hits).
  link: (page: Page, href: string): Locator => page.locator(`a[href="${href}"]`),
} as const;

// ===== Dashboard (components/dashboard.tsx) =====
// Headings/labels that prove the dashboard rendered.
export const dashboard = {
  nextUpTitle: "Next up",
  signupsTrendTitle: "Signups trend · last 7 days",
  byChannelTitle: "By channel · this campaign",
  activeCampaignName: "The Honest Cold Brew — Spring Launch",
  offloadSuggestsEyebrow: "Offload suggests",
  // KPI labels (kpi-label).
  kpis: ["Impressions (7d)", "Signups (7d)", "Engagement rate", "Posts scheduled"] as const,
  newCampaignBtn: "New campaign",
  viewCalendarBtn: "View calendar",
} as const;

// ===== Content Calendar (components/calendar.tsx) =====
export const calendar = {
  week1Label: "Week 1 · May 5 – May 11",
  week2Label: "Week 2 · May 12 – May 18",
  approveAllBtn: "Approve all",
  allChannelsBtn: "All channels",

  // Post tiles carry the .cal-post class and open the drawer on click.
  postTiles: (page: Page): Locator => page.locator(".cal-post"),
  firstPostTile: (page: Page): Locator => page.locator(".cal-post").first(),
} as const;

// ===== Founder Scripts (components/scripts.tsx) =====
export const scripts = {
  // Each script renders as <article class="script-card">.
  cards: (page: Page): Locator => page.locator("article.script-card"),
  firstCard: (page: Page): Locator => page.locator("article.script-card").first(),
  markFilmedBtn: "Mark filmed",
  editBtn: "Edit",
  requestNewScriptBtn: "Request new script",
} as const;

// ===== Content detail drawer (components/content-detail.tsx) =====
// The drawer mounts on useUI.openPost (click a .cal-post / Next-up row).
// Backdrop .drawer-backdrop, panel .drawer; Escape or close button dismisses it.
export const drawer = {
  panel: (page: Page): Locator => page.locator(".drawer"),
  backdrop: (page: Page): Locator => page.locator(".drawer-backdrop"),
  closeAria: "Close", // aria-label on the header close button (I.X)

  approveBtn: "Approve", // primary action for non-video posts
  markFilmedBtn: "Mark filmed", // primary action for video (TikTok) posts

  // Edit button label varies by format family (editModelFor):
  // text→"Edit copy", carousel→"Edit text", image→"Edit caption", video→"Edit script".
  editLabels: {
    text: "Edit copy",
    carousel: "Edit text",
    image: "Edit caption",
    video: "Edit script",
  } as const,

  rescheduleBtn: "Reschedule",
  regenerateImageBtn: "Regenerate image", // image posts only
  deleteBtn: "Delete",
} as const;

// ===== Chat launcher (components/chat-launcher.tsx) =====
export const chat = {
  // FAB aria-label toggles with open state.
  fabOpenAria: "Ask Offload", // shown when closed (click to open)
  fabCloseAria: "Close chat", // shown when open (header + FAB both use this)
  panel: (page: Page): Locator => page.getByRole("dialog", { name: "Ask Offload" }),

  inputAria: "Message Offload", // getByLabel
  sendAria: "Send",

  // Schedule-level suggestion chips (no post open).
  generalSuggestions: ["Add 3 Reddit posts to week 2", "Shift all posts +1 day", "Why did the AMA work?"] as const,
  // Single-post suggestion chips (a post is open).
  postSuggestions: ["Rewrite this warmer", "Make it punchier", "Add a concrete number"] as const,

  // Proposed-change / proposed-edit card (.chat-change) and its actions.
  changeCard: (page: Page): Locator => page.locator(".chat-change"),
  applyBtn: "Apply",
  discardBtn: "Discard",
  proposedChangeHead: "Proposed change", // schedule-level mock card
  proposedEditHead: "Proposed edit", // single-post live patch card
} as const;

// ===== Analytics (components/analytics.tsx) =====
// Default mode is "recap". The ModeToggle (.seg) flips between the two views.
export const analytics = {
  inflightToggle: "In-flight",
  recapToggle: "Recap",
  modeToggle: (page: Page): Locator => page.locator(".seg"),

  // Recap-only strings.
  recapVerdictEyebrow: "Campaign verdict",
  recapHero: "This campaign was a", // h2 "This campaign was a win."
  recapWinSpan: "win.",
  recapForecastChip: "+34% vs forecast",
  recapCacChip: "$0.42 CAC",

  // In-flight-only strings.
  inflightWorkingTitle: "What's working so far",
  inflightSignalChip: "early signal",
} as const;

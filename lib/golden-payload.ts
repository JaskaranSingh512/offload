import type { ChannelId } from "@/lib/data";
import type { PostContent, PostFormat } from "@/lib/types/content";

// The shape both the golden fallback literally is AND validateAndCap produces. Video posts carry
// the founder_scripts fields (angle/hook/beats/shot_note/duration_sec) so the RPC can pair a row.
export type GoldenPost = {
  channel: ChannelId;
  format: PostFormat;
  scheduled_at: string | null; // null for video (founder-posted, never scheduled into the publish query)
  content: PostContent;
  rationale: string;
  status: "scheduled" | "draft";
  approval_state: "pending";
  angle?: string;
  hook?: string;
  beats?: string[];
  shot_note?: string;
  duration_sec?: number;
};

const DAY_MS = 86_400_000;

// Convert model output to an absolute UTC timestamp. Accepts an ISO string (golden — pass through),
// a {day,time} pair (model emits day 0-13 + "HH:MM"), or null (video).
export function resolveScheduledAt(
  raw: string | { day?: number; time?: string } | null | undefined,
  campaignStart: string,
): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    return Number.isNaN(t) ? null : new Date(t).toISOString();
  }
  const startMs = Date.parse(campaignStart);
  const day = typeof raw.day === "number" && Number.isFinite(raw.day) ? Math.max(0, Math.min(13, Math.round(raw.day))) : 0;
  const [h, m] = (raw.time ?? "09:00").split(":").map((n) => parseInt(n, 10));
  const d = new Date(startMs + day * DAY_MS);
  d.setUTCHours(Number.isFinite(h) ? h : 9, Number.isFinite(m) ? m : 0, 0, 0);
  return d.toISOString();
}

// Pre-cached Brew Lab research dossier injected as the generation prompt prefix (mock research —
// the real web-grounded pipeline is v1).
export const CACHED_RESEARCH = `Brew Lab — small-batch cold brew (DTC subscription), Brooklyn.
Audience: home-brew enthusiasts 25-40, urban, pay for freshness; follow design/lifestyle.
Voice: warm + witty, lightly contrarian, numbers-forward.
What works in this niche: honest founder POV with specifics (price, temp, batch size) beats promo ~4x on Reddit;
TikTok slideshows convert ~2.4x talking-head; carousels that open with a one-line claim outperform question-led by ~38%;
Friday limited "drops" sell out fast. Competitors over-claim "small batch" at 4,000-unit runs.`;

const GOLDEN_BASE = "2026-06-22T00:00:00Z";
const ISO = (day: number, hm: string) => resolveScheduledAt({ day, time: hm }, GOLDEN_BASE)!;

// Re-anchor the golden window to the campaign's actual start so fallback posts land in the
// campaign's 2-week window (today-forward) instead of the frozen June-2026 dates.
export function reanchorGolden(campaignStart: string): GoldenPost[] {
  const baseMs = Date.parse(GOLDEN_BASE);
  const start = new Date(campaignStart);
  start.setUTCHours(0, 0, 0, 0);
  return GOLDEN_PAYLOAD.map((p) => {
    if (!p.scheduled_at) return p; // video stays unscheduled
    const ms = Date.parse(p.scheduled_at);
    const offsetDays = Math.floor((ms - baseMs) / DAY_MS);
    const orig = new Date(ms);
    const d = new Date(start.getTime() + offsetDays * DAY_MS);
    d.setUTCHours(orig.getUTCHours(), orig.getUTCMinutes(), 0, 0);
    return { ...p, scheduled_at: d.toISOString() };
  });
}

// Pre-baked ~8-post campaign across all 4 channels + 7 formats. Streamed + inserted when the live
// model call times out / errors / is force-failed, so the on-stage "Generate" never dead-ends.
export const GOLDEN_PAYLOAD: GoldenPost[] = [
  {
    channel: "reddit", format: "reddit_text", scheduled_at: ISO(0, "08:00"), status: "scheduled", approval_state: "pending",
    rationale: "Numbers-forward founder posts earn credibility on r/Coffee before any brand mention.",
    content: { title: "I spent 6 months reverse-engineering a $14 cold brew. Here's what I learned.", body: "Steep temperature matters more than steep time — we landed on 52°F for 18 hours. 'Small batch' is meaningless on a label; the big brands run 4,000-bottle batches, ours are 200. Happy to share the recipe." },
  },
  {
    channel: "x", format: "x_post", scheduled_at: ISO(1, "07:30"), status: "scheduled", approval_state: "pending",
    rationale: "One strong, lightly contrarian claim per post outperforms threads in this niche.",
    content: { title: "", body: "Your cold brew isn't bitter because it's strong. It's over-extracted. Grind coarser. Thank me later." },
  },
  {
    channel: "x", format: "x_thread", scheduled_at: ISO(2, "12:00"), status: "scheduled", approval_state: "pending",
    rationale: "A short myth-busting thread invites replies and positions us as the honest option.",
    content: { tweets: [
      'Most "small batch" cold brew on a grocery shelf is a 4,000-bottle run.',
      "Ours are 200. Both technically small batch. One of them is not.",
      "The label won't tell you the concentrate is 6 months old or that 80% of the bottle is water.",
      "If you want the actual small-batch version it's $4.50 and brewed this week. (brewlab.co)",
    ] },
  },
  {
    channel: "instagram", format: "ig_carousel", scheduled_at: ISO(3, "13:00"), status: "scheduled", approval_state: "pending",
    rationale: "Carousels opening with a one-line claim outperform question-led by ~38% here.",
    content: { slides: [
      { heading: "Most cold brew tastes like sad iced coffee.", sub: "" },
      { heading: "Problem: it's brewed at fridge temp.", sub: "You want 52°F, not 38°F." },
      { heading: "Problem: it's 80% water.", sub: "Check the back of the label." },
      { heading: "The fix:", sub: "Brew slow. Bottle fresh. Drink soon." },
    ], caption: "Cold brew that doesn't taste like sad iced coffee. 18 hours, 52°F, 200-bottle batch. Link in bio. #coldbrew #smallbatch" },
  },
  {
    channel: "instagram", format: "ig_single", scheduled_at: ISO(4, "15:00"), status: "scheduled", approval_state: "pending",
    rationale: "A single hero shot with a tight caption drives saves for the Friday drop.",
    content: { caption: "Friday drop: oat-milk concentrate, 200 bottles. Last one sold out in 38 minutes.", image_prompt: "A brown glass cold brew bottle on a sunlit Brooklyn windowsill, cream label, shallow depth of field", image_path: "" },
  },
  {
    channel: "tiktok", format: "tiktok_script", scheduled_at: null, status: "draft", approval_state: "pending",
    rationale: "Slideshow format converts ~2.4x talking-head; founder POV at unusual hours overperforms.",
    content: { hook: "4am, bottling day, no caffeine until the first one's done.", scenes: [
      "Wide shot walking into the dim basement, 4:02am on screen",
      "Hands rinsing equipment twice",
      "Open the tank, slow pour into the siphon",
      "Fast cut of bottles filling, 'one every 6 seconds'",
      "Sun through the window, '200 bottles by sunrise'",
    ], shot_note: "Vertical 9:16, no voiceover, strong on-screen text every 4s", duration_sec: 38 },
    angle: "founder-pov", hook: "4am, bottling day, no caffeine until the first one's done.",
    beats: ["4:02am walk-in", "clean twice", "slow pour", "bottles filling", "sunrise, 200 bottles"],
    shot_note: "Vertical 9:16, no voiceover", duration_sec: 38,
  },
  {
    channel: "tiktok", format: "founder_script", scheduled_at: null, status: "draft", approval_state: "pending",
    rationale: "A talking-head founder confession builds trust; founder-posted, never auto-published.",
    content: {},
    angle: "founder-confession", hook: "For a year I tried to be the next Stumptown. Nobody asked me to.",
    beats: ["Hook straight to camera", "Quit my job in 2022", "Copied the big brands for 18 months", "The only thing that worked was being small and weird on purpose", "Close: if you're trying to be the next anything, you're already late"],
    shot_note: "Talking head in the production space, no B-roll", duration_sec: 55,
  },
  {
    channel: "reddit", format: "reddit_text", scheduled_at: ISO(6, "09:30"), status: "scheduled", approval_state: "pending",
    rationale: "An AMA-style post sustains the honest-founder thread that drives the most signups.",
    content: { title: "AMA: I run a 4-person cold brew company out of a 600sqft Brooklyn space", body: "Three years in, direct-trade with 4 farms, 12,000 bottles a month. Ask me anything about sourcing, unit economics, or why glass beats plastic online." },
  },
];

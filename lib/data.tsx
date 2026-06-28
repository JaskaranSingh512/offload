import type { ReactNode } from "react";
import { I, type IconProps } from "@/components/icons";

// ===== Types =====
export type ChannelId = "reddit" | "tiktok" | "instagram" | "x";
export type PostKind = "reddit" | "carousel" | "tiktok" | "thread";

export interface ChannelMeta {
  name: string;
  color: string;
  Icon: (p: IconProps) => ReactNode;
}

export interface Post {
  id: string;
  day: number;
  time: string;
  channel: ChannelId;
  type: string;
  title: string;
  kind: PostKind;
  subreddit?: string;
  slidesId?: string;
  scriptId?: string;
  // Live-only fields (set by the Supabase adapter in lib/api.ts; undefined for mock rows).
  // Let the drawer/mutations reference real DB rows without breaking the mock view-model.
  dbId?: string;
  format?: import("@/lib/types/content").PostFormat;
  status?: string;
  approvalState?: string;
  scriptDbId?: string;
  // Live posts.content JSONB (the drawer renders from this; undefined for mock rows).
  content?: import("@/lib/types/content").PostContent;
}

export interface DateLabel {
  num: number;
  dow: string;
  month: string;
}

export interface CarouselSlide {
  eyebrow: string;
  text: string;
  sub?: string;
  tone: "espresso" | "cream" | "teal";
}

export interface TikTokScene {
  onScreen: string;
  vo: string;
  meta: string;
}

export interface TikTokScript {
  hook: string;
  duration: string;
  scenes: TikTokScene[];
}

export interface FounderScript {
  id: string;
  title: string;
  angle: string;
  duration: string;
  platforms: string[];
  hook: string;
  beats: { time: string; text: string }[];
  note: string;
  // Live-only: the paired post row id, so "Mark filmed" can flip the post status (undefined for mock).
  postDbId?: string;
  filmed?: boolean;
}

export interface ChannelStat {
  channel: ChannelId;
  impressions: number;
  signups: number;
  ctr: number;
  sentiment: number;
}

export interface FormatStat {
  name: string;
  channel: ChannelId;
  impressions: number;
  eng: number;
  signups: number;
  winner: boolean;
}

// ===== Channel meta =====
export const channelMeta: Record<ChannelId, ChannelMeta> = {
  reddit: { name: "Reddit", color: "#FF4500", Icon: (p) => <I.Reddit {...p} /> },
  tiktok: { name: "TikTok", color: "#111111", Icon: (p) => <I.TikTok {...p} /> },
  instagram: { name: "Instagram", color: "#E1306C", Icon: (p) => <I.Instagram {...p} /> },
  x: { name: "X", color: "#000000", Icon: (p) => <I.XLogo {...p} /> },
};

// Generate 14 days × ~3 posts. Each post: id, day(0-13), time, channel, type, title, body data
export const posts: Post[] = [
  // ===== WEEK 1 =====
  { id: "p1", day: 0, time: "08:00", channel: "reddit", type: "Reddit post", title: "Spent 6 months reverse-engineering a $14 cold brew. Here's what I learned.", kind: "reddit", subreddit: "r/Coffee" },
  { id: "p2", day: 0, time: "12:30", channel: "instagram", type: "IG carousel", title: "Why your cold brew tastes like sad iced coffee", kind: "carousel", slidesId: "sad_iced" },
  { id: "p3", day: 0, time: "18:00", channel: "tiktok", type: "TikTok slideshow", title: "3 cold brews, blind taste test, real reactions", kind: "tiktok", scriptId: "blind_taste" },

  { id: "p4", day: 1, time: "07:30", channel: "x", type: "X thread", title: "A short thread on cold brew vs iced coffee (most people are doing it wrong).", kind: "thread" },
  { id: "p5", day: 1, time: "13:00", channel: "instagram", type: "IG carousel", title: "The Brew Lab origin story, in 7 slides", kind: "carousel", slidesId: "origin" },
  { id: "p6", day: 1, time: "20:00", channel: "reddit", type: "Reddit post", title: "Remote workers — what's your morning routine actually look like?", kind: "reddit", subreddit: "r/remotework" },

  { id: "p7", day: 2, time: "09:00", channel: "tiktok", type: "TikTok slideshow", title: "Founder POV: bottling day at 4am", kind: "tiktok", scriptId: "bottling" },
  { id: "p8", day: 2, time: "15:00", channel: "instagram", type: "IG post", title: "Behind the steep — 18 hours, cold filtered", kind: "carousel", slidesId: "process" },
  { id: "p9", day: 2, time: "19:30", channel: "x", type: "X post", title: 'Hot take: most "small batch" labels are doing 4,000 units.', kind: "thread" },

  { id: "p10", day: 3, time: "08:30", channel: "reddit", type: "Reddit post", title: "AMA: I run a 4-person cold brew company out of a 600sqft Brooklyn space", kind: "reddit", subreddit: "r/smallbusiness" },
  { id: "p11", day: 3, time: "14:00", channel: "instagram", type: "IG carousel", title: "5 cold brew myths a barista quietly believes", kind: "carousel", slidesId: "myths" },
  { id: "p12", day: 3, time: "21:00", channel: "tiktok", type: "TikTok slideshow", title: "I rated 8 grocery store cold brews so you don't have to", kind: "tiktok", scriptId: "rated" },

  { id: "p13", day: 4, time: "10:00", channel: "instagram", type: "IG carousel", title: "Friday drop: oat-milk concentrate, only 200 bottles", kind: "carousel", slidesId: "drop" },
  { id: "p14", day: 4, time: "16:30", channel: "x", type: "X post", title: "Friday drop just went live. Last one sold out in 38 minutes. Don't @ me.", kind: "thread" },

  { id: "p15", day: 5, time: "11:00", channel: "tiktok", type: "TikTok slideshow", title: "Saturday morning, slow pour, no talking", kind: "tiktok", scriptId: "asmr" },
  { id: "p16", day: 5, time: "17:00", channel: "instagram", type: "IG post", title: "Reader recipe: cold brew negroni", kind: "carousel", slidesId: "recipe" },

  { id: "p17", day: 6, time: "09:30", channel: "reddit", type: "Reddit post", title: "Sunday review: 12oz vs 32oz — what do you actually drink?", kind: "reddit", subreddit: "r/Coffee" },
  { id: "p18", day: 6, time: "14:30", channel: "instagram", type: "IG carousel", title: "Things our customers said this week (unedited)", kind: "carousel", slidesId: "reviews" },

  // ===== WEEK 2 =====
  { id: "p19", day: 7, time: "08:00", channel: "instagram", type: "IG carousel", title: "Monday reset: the cold brew that fits your desk", kind: "carousel", slidesId: "monday" },
  { id: "p20", day: 7, time: "12:00", channel: "tiktok", type: "TikTok slideshow", title: "My desk setup as a remote founder (no plant, no LED)", kind: "tiktok", scriptId: "desk" },
  { id: "p21", day: 7, time: "19:00", channel: "reddit", type: "Reddit post", title: "Are you team concentrate or team ready-to-drink? Be honest.", kind: "reddit", subreddit: "r/Coffee" },

  { id: "p22", day: 8, time: "07:00", channel: "x", type: "X thread", title: "6 things I'd tell my pre-launch self about packaging.", kind: "thread" },
  { id: "p23", day: 8, time: "13:30", channel: "instagram", type: "IG carousel", title: "The packaging journey — v1 to v4", kind: "carousel", slidesId: "packaging" },
  { id: "p24", day: 8, time: "18:30", channel: "tiktok", type: "TikTok slideshow", title: "Cold brew at home in 4 steps (no special gear)", kind: "tiktok", scriptId: "athome" },

  { id: "p25", day: 9, time: "09:00", channel: "reddit", type: "Reddit post", title: 'What does "small batch" actually mean to you?', kind: "reddit", subreddit: "r/Coffee" },
  { id: "p26", day: 9, time: "15:00", channel: "instagram", type: "IG post", title: "A cup, a window, a Wednesday", kind: "carousel", slidesId: "cup" },

  { id: "p27", day: 10, time: "10:00", channel: "instagram", type: "IG carousel", title: "Cold brew + 7 things that pair surprisingly well", kind: "carousel", slidesId: "pair" },
  { id: "p28", day: 10, time: "14:30", channel: "tiktok", type: "TikTok slideshow", title: "Things baristas would never order at a cafe", kind: "tiktok", scriptId: "barista" },
  { id: "p29", day: 10, time: "20:00", channel: "x", type: "X post", title: "Reminder: caffeine has a half-life of 5 hours. Plan accordingly.", kind: "thread" },

  { id: "p30", day: 11, time: "10:00", channel: "instagram", type: "IG carousel", title: 'Friday drop: limited release "Studio 04" — 18hr Honduran', kind: "carousel", slidesId: "studio04" },
  { id: "p31", day: 11, time: "17:00", channel: "reddit", type: "Reddit post", title: "Limited release just dropped — would love feedback if anyone tries it", kind: "reddit", subreddit: "r/Coffee" },

  { id: "p32", day: 12, time: "11:00", channel: "tiktok", type: "TikTok slideshow", title: "Weekend project: turn your fridge into a cold brew bar", kind: "tiktok", scriptId: "fridge" },
  { id: "p33", day: 12, time: "16:00", channel: "instagram", type: "IG carousel", title: "Weekend reading: 4 books that shaped Brew Lab", kind: "carousel", slidesId: "books" },

  { id: "p34", day: 13, time: "10:00", channel: "instagram", type: "IG post", title: "Two weeks, one cold brew. Thanks for following along.", kind: "carousel", slidesId: "thanks" },
  { id: "p35", day: 13, time: "15:00", channel: "reddit", type: "Reddit post", title: "End of our 2-week experiment — what we learned posting daily", kind: "reddit", subreddit: "r/marketing" },
];

export const dateLabels: DateLabel[] = [
  { num: 5, dow: "MON", month: "MAY" },
  { num: 6, dow: "TUE", month: "MAY" },
  { num: 7, dow: "WED", month: "MAY" },
  { num: 8, dow: "THU", month: "MAY" },
  { num: 9, dow: "FRI", month: "MAY" },
  { num: 10, dow: "SAT", month: "MAY" },
  { num: 11, dow: "SUN", month: "MAY" },
  { num: 12, dow: "MON", month: "MAY" },
  { num: 13, dow: "TUE", month: "MAY" },
  { num: 14, dow: "WED", month: "MAY" },
  { num: 15, dow: "THU", month: "MAY" },
  { num: 16, dow: "FRI", month: "MAY" },
  { num: 17, dow: "SAT", month: "MAY" },
  { num: 18, dow: "SUN", month: "MAY" },
];

// Today is day 2 (Wed May 7) for the dashboard's "active campaign" state
export const TODAY_DAY = 2;

// Reddit post content (long form)
export const redditBody = `I run a 4-person cold brew operation called Brew Lab. Last spring I got tired of paying $5.99 for a 10oz bottle of "premium" cold brew that, when I checked the back of the label, was 80% water and 20% concentrate that had probably been sitting on a pallet for six months.

So I bought a $14 bottle of what's allegedly the best one in the country, took it home, and spent the next six months trying to make something better — or at least, more honest — out of our basement.

A few things I learned that I wish I'd known on day one:

**1. Steep time matters way less than steep temperature.**
Most "cold brew" you buy is actually steeped at fridge temperature (~38°F). That's the wrong move. We landed on 52°F for 18 hours — extracts way more body without the bitterness you get above 60°F.

**2. "Small batch" is meaningless on a label.**
The two biggest "small batch" cold brew brands in the grocery aisle are doing 4,000-bottle runs. Ours are 200. Both are technically small batch.

**3. Concentrate vs ready-to-drink is a philosophy fight, not a flavor one.**
Concentrate gives the customer control. Ready-to-drink is more honest about the experience you're selling. We do both. The split is roughly 60/40 toward ready-to-drink, and I think that says more about modern customers than it does about coffee.

**4. The packaging is the product.**
We went through four bottle iterations. The one we landed on is a 12oz brown glass bottle with a screen-printed cream label. Total unit cost: $1.82. Worth every cent.

Happy to answer questions. Not selling anything in this post — happy to share the recipe if anyone wants it.`;

// Carousel content — multiple sets
export const carouselSets: Record<string, CarouselSlide[]> = {
  sad_iced: [
    { eyebrow: "Cold Brew 101", text: "Most cold brew tastes like sad iced coffee.", tone: "espresso" },
    { eyebrow: "Problem #1", text: "It's brewed at fridge temp.", sub: "You need 50°F, not 38°F.", tone: "cream" },
    { eyebrow: "Problem #2", text: "It's 80% water on the back of the label.", tone: "cream" },
    { eyebrow: "Problem #3", text: "It's been sitting on a pallet for 6 months.", tone: "cream" },
    { eyebrow: "The fix", text: "Brew slow. Bottle fresh. Drink soon.", tone: "teal" },
    { eyebrow: "", text: "We made one we'd actually drink.", sub: "brewlab.co", tone: "espresso" },
  ],
  origin: [
    { eyebrow: "Brew Lab", text: "How we ended up in a 600sqft Brooklyn basement.", tone: "espresso" },
    { eyebrow: "2022", text: "Quit my agency job.", tone: "cream" },
    { eyebrow: "2023", text: "Bought a used 50L tank off Craigslist.", tone: "cream" },
    { eyebrow: "2024", text: "Sold 200 bottles to friends.", tone: "cream" },
    { eyebrow: "2025", text: "Now: 4 people, 12,000 bottles a month.", tone: "teal" },
    { eyebrow: "Why", text: "We thought coffee deserved more honesty.", tone: "espresso" },
    { eyebrow: "Try us", text: "brewlab.co — link in bio.", tone: "cream" },
  ],
  myths: [
    { eyebrow: "5 myths", text: "A barista quietly believes.", tone: "espresso" },
    { eyebrow: "Myth 1", text: "Dark roast = stronger.", sub: "Actually has less caffeine.", tone: "cream" },
    { eyebrow: "Myth 2", text: '"Small batch" means something.', sub: "It legally does not.", tone: "cream" },
    { eyebrow: "Myth 3", text: "Cold brew is less acidic.", sub: "Only at the right pH.", tone: "cream" },
    { eyebrow: "Myth 4", text: "Espresso has more caffeine.", sub: "Per oz, yes. Per drink, no.", tone: "cream" },
    { eyebrow: "Myth 5", text: "Beans are best within 2 weeks.", sub: "Try 3-21 days post-roast.", tone: "teal" },
  ],
};

// TikTok script content
export const tiktokScripts: Record<string, TikTokScript> = {
  blind_taste: {
    hook: "I gave 3 strangers 3 cold brews. One was $2. One was $14. Watch what happened.",
    duration: "47s",
    scenes: [
      { onScreen: "3 brands. 1 winner.", vo: "Show 3 unmarked bottles, hands placing them on table", meta: "0:00 – 0:03" },
      { onScreen: "No labels. No prices.", vo: "Pour 3 small cups, side by side", meta: "0:03 – 0:08" },
      { onScreen: "Taster #1", vo: "Reaction shot, sip, slight wince", meta: "0:08 – 0:15" },
      { onScreen: '"Tastes like burnt coffee water"', vo: "Quote text card on cream background", meta: "0:15 – 0:20" },
      { onScreen: "Taster #2", vo: "Reaction shot, immediate nod", meta: "0:20 – 0:28" },
      { onScreen: '"I would buy this."', vo: "Quote card, this one tinted teal", meta: "0:28 – 0:33" },
      { onScreen: "The reveal", vo: "Flip bottles around, show labels one by one", meta: "0:33 – 0:42" },
      { onScreen: "Winner: $4 cold brew from a Brooklyn basement.", vo: "Hold on the Brew Lab bottle, soft smile", meta: "0:42 – 0:47" },
    ],
  },
  bottling: {
    hook: "4am, bottling day, no caffeine until the first one's done.",
    duration: "38s",
    scenes: [
      { onScreen: "4:02am", vo: "Wide shot, walking into dim basement", meta: "0:00 – 0:04" },
      { onScreen: "First job: clean everything twice.", vo: "Hands rinsing equipment", meta: "0:04 – 0:10" },
      { onScreen: "Tank: 18 hours of slow steep, ready.", vo: "Open tank, slow pour into siphon", meta: "0:10 – 0:18" },
      { onScreen: "One bottle every 6 seconds.", vo: "Fast cut of bottles filling in sequence", meta: "0:18 – 0:26" },
      { onScreen: "200 bottles by sunrise.", vo: "Wider shot, sun coming through window", meta: "0:26 – 0:32" },
      { onScreen: "First sip of the day.", vo: "Founder pouring small cup, drinking", meta: "0:32 – 0:38" },
    ],
  },
  rated: {
    hook: "I rated 8 grocery store cold brews so you don't have to.",
    duration: "52s",
    scenes: [
      { onScreen: "8 grocery store cold brews. Rated.", vo: "Lineup of bottles on counter", meta: "0:00 – 0:04" },
      { onScreen: "#8: 3/10. Tastes like cardboard.", vo: "Pour, sip, wince", meta: "0:04 – 0:11" },
      { onScreen: "#5: 5/10. Fine, forgettable.", vo: "Sip, shrug", meta: "0:11 – 0:19" },
      { onScreen: "#3: 7/10. Surprisingly good for $4.", vo: "Sip, raise eyebrow", meta: "0:19 – 0:28" },
      { onScreen: "#1: 9/10. The one I keep buying.", vo: "Sip, nod, hold bottle up", meta: "0:28 – 0:38" },
      { onScreen: "Brand reveal at the end →", vo: "Tease, walk away from counter", meta: "0:38 – 0:45" },
      { onScreen: "Stitch reply with your guess.", vo: "Founder talking to camera", meta: "0:45 – 0:52" },
    ],
  },
};

// Founder scripts (talking head — different from auto-posted)
export const founderScripts: FounderScript[] = [
  {
    id: "s1",
    title: "Why I stopped trying to be the next Stumptown",
    angle: "Founder confession",
    duration: "55s",
    platforms: ["TikTok", "IG Reels"],
    hook: '"For about a year, I was trying to build the next Stumptown. Then I realized: nobody asked me to."',
    beats: [
      { time: "0:00", text: "Hook — say it straight to camera, no edit." },
      { time: "0:05", text: "Context: I quit my job in 2022 to start Brew Lab." },
      { time: "0:15", text: "For 18 months I copied the big brands' packaging, voice, retail strategy." },
      { time: "0:28", text: "Punchline — **the only thing that worked was being weird and small on purpose.**" },
      { time: "0:40", text: "One concrete example: ditched the wholesale push, doubled DTC, revenue up 3x." },
      { time: "0:50", text: 'Close: "If you\'re trying to be the next anything, you\'re already late."' },
    ],
    note: "Shoot in basement / production space. No B-roll, just talking head.",
  },
  {
    id: "s2",
    title: "The unit economics of small batch (and why nobody talks about it)",
    angle: "Numbers explainer",
    duration: "70s",
    platforms: ["TikTok", "IG Reels"],
    hook: '"Here\'s the math on a $5.99 cold brew. You\'re probably going to be a little annoyed."',
    beats: [
      { time: "0:00", text: "Hook to camera, hold up a Brew Lab bottle." },
      { time: "0:06", text: "Break down COGS: $1.82 packaging + $0.94 coffee + $0.40 labor = $3.16." },
      { time: "0:25", text: "Retail margin: 40%. Distributor margin: 15%. Brand keeps about 90¢." },
      { time: "0:42", text: "**That's why most coffee brands die at scale.** The math doesn't work." },
      { time: "0:55", text: "How we sidestep it: skip distribution, sell direct, refuse to do retail under $5.50." },
      { time: "1:05", text: 'Close: "Buying small batch is voting for a different math."' },
    ],
    note: "Use an iPad with rough numbers handwritten — keep it casual.",
  },
  {
    id: "s3",
    title: "4 things I'd tell my 2022 self about packaging",
    angle: "Lessons learned",
    duration: "60s",
    platforms: ["TikTok", "IG Reels"],
    hook: '"4 things I\'d tell my 2022 self about packaging — one of them cost me $11,000."',
    beats: [
      { time: "0:00", text: "Hook on camera, glance at line of 4 different bottle prototypes on the shelf behind." },
      { time: "0:08", text: '#1 — Don\'t pay a "branding studio" until you\'ve sold 1,000 units.' },
      { time: "0:22", text: "#2 — Glass costs 4x plastic but converts 2x better online. Worth it." },
      { time: "0:36", text: "#3 — Screen-print over labels. Always. Always." },
      { time: "0:48", text: "#4 — **Your first bottle will be wrong. Plan to redo it in 6 months.**" },
      { time: "0:55", text: 'Close: "If I\'d known these I\'d have $11k extra and 6 months back."' },
    ],
    note: "Walk-and-talk in the basement, hold each bottle as you mention it.",
  },
  {
    id: "s4",
    title: "A day in the life of a 4-person cold brew company",
    angle: "Behind the scenes",
    duration: "90s",
    platforms: ["TikTok", "IG Reels", "YouTube Shorts"],
    hook: '"This is what a Wednesday looks like when you\'re 4 people trying to ship 12,000 bottles a month."',
    beats: [
      { time: "0:00", text: "Hook to camera while walking into the space, 5:42am timestamp on screen." },
      { time: "0:10", text: "5:45 — Clean and prep two 50L tanks." },
      { time: "0:24", text: "6:30 — First bottling shift begins, Maya joins." },
      { time: "0:40", text: "9:00 — DM and email batch (founder, 45 min)." },
      { time: "0:55", text: "11:00 — Lunch break, walk to coffee shop, drink someone else's coffee on purpose." },
      { time: "1:10", text: "1:00pm — Wholesale calls, packaging tweaks, content shoot." },
      { time: "1:25", text: 'Close: "Everyone here does 3 jobs. We probably do all of them badly."' },
    ],
    note: "Multi-cut, fast-paced. Use timestamps as on-screen anchors.",
  },
];

// Analytics — channel performance
export const channelStats: ChannelStat[] = [
  { channel: "reddit", impressions: 142000, signups: 482, ctr: 4.8, sentiment: 92 },
  { channel: "tiktok", impressions: 387000, signups: 391, ctr: 2.1, sentiment: 88 },
  { channel: "instagram", impressions: 218000, signups: 264, ctr: 3.2, sentiment: 84 },
  { channel: "x", impressions: 68000, signups: 98, ctr: 1.6, sentiment: 79 },
];

// Format performance
export const formatStats: FormatStat[] = [
  { name: "TikTok slideshow", channel: "tiktok", impressions: 287000, eng: 8.4, signups: 247, winner: true },
  { name: "Reddit long-form", channel: "reddit", impressions: 89000, eng: 12.1, signups: 312, winner: true },
  { name: "IG carousel", channel: "instagram", impressions: 142000, eng: 6.2, signups: 178, winner: false },
  { name: "X thread", channel: "x", impressions: 41000, eng: 3.4, signups: 64, winner: false },
  { name: "TikTok talking head", channel: "tiktok", impressions: 100000, eng: 5.1, signups: 144, winner: false },
  { name: "IG single post", channel: "instagram", impressions: 76000, eng: 3.8, signups: 86, winner: false },
];

export const working = [
  { title: "Honest, numbers-forward Reddit posts", detail: "Both AMA-style posts cleared 200+ signups. Treat Reddit like its own channel, not an afterthought." },
  { title: "Founder POV TikToks at unusual hours", detail: 'The 4am bottling video drove 71k views. The "barista wouldn\'t order" video drove another 58k.' },
  { title: "Carousels with one-line title slides", detail: "Open with a punchy claim. Carousels that opened with a question underperformed by 38%." },
  { title: '"Limited drop" Friday cadence', detail: "Both Friday drops sold out in under 90 minutes. The runway here is wider than we thought." },
];

export const recommendations = [
  { tag: "DOUBLE DOWN", title: "Double down on TikTok slideshows.", detail: "The slideshow format is doing 2.4x the signups-per-impression of any other TikTok format. Move budget from talking-head to slideshow for the next campaign." },
  { tag: "INCREASE FREQUENCY", title: "Reddit drove the most signups — go from 1 to 3 posts/week.", detail: "Reddit's impression-to-signup conversion is 5.8x TikTok's. The bottleneck is volume, not quality." },
  { tag: "PUT PAID BEHIND IT", title: 'Boost the "Brew Lab origin story" carousel.', detail: "It outperformed every other IG post by 42% and has the highest save rate. $400 in spend should net ~14,000 new impressions to a high-intent audience." },
  { tag: "CUT", title: "Reduce X posting from daily to 2x/week.", detail: "X is your weakest channel by every metric. Keep a presence, but redirect that production time to Reddit and TikTok." },
];

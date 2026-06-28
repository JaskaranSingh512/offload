import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import type { PostContent, PostFormat } from "@/lib/types/content";
import * as mock from "@/lib/data";
import type {
  Post,
  PostKind,
  ChannelId,
  DateLabel,
  FounderScript,
  ChannelStat,
  FormatStat,
} from "@/lib/data";

// ===== Mock→live seam =====
// USE_MOCK defaults to true (mock-first) and DEMO falls back to the Brew Lab showcase id,
// so the app works even if the two env vars aren't set. Flip NEXT_PUBLIC_USE_MOCK=false
// to read live Supabase rows.
const USE_MOCK = (process.env.NEXT_PUBLIC_USE_MOCK ?? "true") === "true";
const DEMO =
  process.env.NEXT_PUBLIC_DEMO_ACCOUNT_ID ?? "00000000-0000-0000-0000-00000b1e51ab";

type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
type PostRow = Database["public"]["Tables"]["posts"]["Row"];

// One browser client for all reads (RLS resolves via the user's session cookie).
let _sb: ReturnType<typeof createClient> | null = null;
const sb = () => (_sb ??= createClient());

const DAY_MS = 86_400_000;

// ===== Format → view-model lookups (CONTRACT §1b/§1d) =====
const FORMAT_TYPE: Record<PostFormat, string> = {
  reddit_text: "Reddit post",
  x_post: "X post",
  x_thread: "X thread",
  ig_carousel: "IG carousel",
  ig_single: "IG post",
  tiktok_script: "TikTok slideshow",
  founder_script: "Founder script",
};
const FORMAT_KIND: Record<PostFormat, PostKind> = {
  reddit_text: "reddit",
  x_post: "thread",
  x_thread: "thread",
  ig_carousel: "carousel",
  ig_single: "carousel",
  tiktok_script: "tiktok",
  founder_script: "tiktok",
};
const FORMAT_NAME: Record<PostFormat, string> = {
  reddit_text: "Reddit long-form",
  x_post: "X post",
  x_thread: "X thread",
  ig_carousel: "IG carousel",
  ig_single: "IG single post",
  tiktok_script: "TikTok slideshow",
  founder_script: "TikTok talking head",
};

function titleFor(format: PostFormat, content: PostContent | null): string {
  const c = (content ?? {}) as Record<string, unknown>;
  switch (format) {
    case "reddit_text":
    case "x_post":
      return (c.title as string) || (c.body as string) || "Untitled post";
    case "x_thread":
      return ((c.tweets as string[]) ?? [])[0] || "X thread";
    case "ig_carousel":
      return (
        (c.caption as string) ||
        ((c.slides as { heading: string }[]) ?? [])[0]?.heading ||
        "IG carousel"
      );
    case "ig_single":
      return (c.caption as string) || "IG post";
    case "tiktok_script":
    case "founder_script":
      return (c.hook as string) || "Video script";
  }
}

function timeOf(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

// DB posts row → the bespoke `Post` view-model the surfaces already render.
function mapPostRow(row: PostRow, startMs: number): Post {
  const rowMs = row.scheduled_at ? new Date(row.scheduled_at).getTime() : startMs;
  const day = Math.min(13, Math.max(0, Math.floor((rowMs - startMs) / DAY_MS)));
  const format = row.format as PostFormat;
  const content = (row.content ?? null) as PostContent | null;
  return {
    id: row.id,
    day,
    time: timeOf(row.scheduled_at),
    channel: row.channel as ChannelId,
    type: FORMAT_TYPE[format],
    title: titleFor(format, content),
    kind: FORMAT_KIND[format],
    dbId: row.id,
    format,
    status: row.status ?? undefined,
    approvalState: row.approval_state ?? undefined,
  };
}

const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function buildDateLabels(startMs: number): DateLabel[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startMs + i * DAY_MS);
    return { num: d.getUTCDate(), dow: DOW[d.getUTCDay()], month: MON[d.getUTCMonth()] };
  });
}

// ===== The campaign view (posts + the calendar's day↔label axis, kept in sync) =====
export interface CampaignView {
  posts: Post[];
  dateLabels: DateLabel[];
  todayDay: number;
}

export const api = {
  async getCampaign(): Promise<CampaignView> {
    if (USE_MOCK) {
      return { posts: mock.posts, dateLabels: mock.dateLabels, todayDay: mock.TODAY_DAY };
    }
    const { data, error } = await sb()
      .from("posts")
      .select("*")
      .eq("account_id", DEMO)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    const rows = data ?? [];
    const times = rows
      .map((r) => (r.scheduled_at ? new Date(r.scheduled_at).getTime() : null))
      .filter((t): t is number => t !== null);
    const startMs = times.length ? Math.min(...times) : Date.now();
    const posts = rows.map((r) => mapPostRow(r, startMs));
    const todayDay = Math.min(13, Math.max(0, Math.floor((Date.now() - startMs) / DAY_MS)));
    return { posts, dateLabels: buildDateLabels(startMs), todayDay };
  },

  async getScripts(): Promise<FounderScript[]> {
    if (USE_MOCK) return mock.founderScripts;
    const { data, error } = await sb()
      .from("founder_scripts")
      .select("*, posts!inner(id, format)")
      .eq("account_id", DEMO)
      .in("posts.format", ["tiktok_script", "founder_script"]);
    if (error) throw error;
    return (data ?? []).map((s): FounderScript => {
      const beats = (Array.isArray(s.beats) ? s.beats : []) as unknown[];
      const joined = (s as { posts?: { id: string } | { id: string }[] }).posts;
      const post = Array.isArray(joined) ? joined[0] : joined;
      return {
        id: s.id,
        title: s.title ?? "Untitled script",
        angle: s.angle ?? "",
        duration: s.duration_sec ? `${s.duration_sec}s` : "—",
        platforms: ["TikTok", "IG Reels"],
        hook: s.hook ?? "",
        beats: beats.map((b, i) =>
          typeof b === "string"
            ? { time: `Beat ${i + 1}`, text: b }
            : { time: String((b as { time?: string })?.time ?? ""), text: String((b as { text?: string })?.text ?? "") },
        ),
        note: s.shot_note ?? "",
        postDbId: post?.id,
        filmed: s.filmed ?? false,
      };
    });
  },

  async getAnalytics(): Promise<{
    channelStats: ChannelStat[];
    formatStats: FormatStat[];
    working: typeof mock.working;
    recommendations: typeof mock.recommendations;
  }> {
    if (USE_MOCK) {
      return {
        channelStats: mock.channelStats,
        formatStats: mock.formatStats,
        working: mock.working,
        recommendations: mock.recommendations,
      };
    }
    const { data, error } = await sb()
      .from("post_metrics")
      .select("impressions, engagements, engagement_rate, followers_delta, posts!inner(channel, format, account_id)")
      .eq("account_id", DEMO);
    if (error) throw error;
    type MetricRow = {
      impressions: number | null;
      engagements: number | null;
      engagement_rate: number | null;
      followers_delta: number | null;
      posts: { channel: string; format: string } | { channel: string; format: string }[];
    };
    const rows = (data ?? []) as unknown as MetricRow[];
    const post = (r: MetricRow) => (Array.isArray(r.posts) ? r.posts[0] : r.posts);

    // Channel aggregation
    const byChannel = new Map<ChannelId, { imp: number; eng: number; signups: number; n: number }>();
    const byFormat = new Map<PostFormat, { imp: number; engRate: number; signups: number; n: number }>();
    for (const r of rows) {
      const p = post(r);
      if (!p) continue;
      const ch = p.channel as ChannelId;
      const fmt = p.format as PostFormat;
      const imp = r.impressions ?? 0;
      const eng = r.engagements ?? 0;
      const signups = r.followers_delta ?? 0;
      const er = Number(r.engagement_rate ?? 0);
      const c = byChannel.get(ch) ?? { imp: 0, eng: 0, signups: 0, n: 0 };
      byChannel.set(ch, { imp: c.imp + imp, eng: c.eng + eng, signups: c.signups + signups, n: c.n + 1 });
      const f = byFormat.get(fmt) ?? { imp: 0, engRate: 0, signups: 0, n: 0 };
      byFormat.set(fmt, { imp: f.imp + imp, engRate: f.engRate + er, signups: f.signups + signups, n: f.n + 1 });
    }
    const channelStats: ChannelStat[] = [...byChannel.entries()].map(([channel, v]) => ({
      channel,
      impressions: v.imp,
      signups: v.signups,
      ctr: v.imp ? Math.round((v.eng / v.imp) * 1000) / 10 : 0,
      sentiment: 85,
    }));
    const fmtEntries = [...byFormat.entries()].map(([fmt, v]) => ({
      name: FORMAT_NAME[fmt],
      channel: (FORMAT_KIND[fmt] === "tiktok" ? "tiktok" : FORMAT_KIND[fmt] === "carousel" ? "instagram" : fmt === "reddit_text" ? "reddit" : "x") as ChannelId,
      impressions: v.imp,
      eng: v.n ? Math.round((v.engRate / v.n) * 1000) / 10 : 0,
      signups: v.signups,
    }));
    const topEng = Math.max(0, ...fmtEntries.map((f) => f.eng));
    const formatStats: FormatStat[] = fmtEntries
      .sort((a, b) => b.impressions - a.impressions)
      .map((f) => ({ ...f, winner: f.eng === topEng && topEng > 0 }));
    // Qualitative "what worked" + ranked recs stay seeded for Phase 4 (rule-based recs = Phase 5).
    return { channelStats, formatStats, working: mock.working, recommendations: mock.recommendations };
  },

  // Brand for Settings + onboarding prefill: the session user's own row, falling back to the
  // Brew Lab showcase brand so the surface always has something to render.
  async getBrand(): Promise<BrandRow | null> {
    if (USE_MOCK) {
      return {
        account_id: DEMO,
        name: "Brew Lab",
        one_liner: "Small-batch cold brew, brewed slow.",
        domain: "brewlab.co",
        colors: {},
        voice: "warm_witty",
        audience: "Remote workers and creatives, 25–40, who care about quality and aesthetics.",
        goal: "awareness",
        doc_name: null,
        doc_text: null,
        industry: "specialty coffee / DTC",
        recommended_channels: ["instagram", "tiktok"],
        channel_rationale: null,
      } as BrandRow;
    }
    const { data: { user } } = await sb().auth.getUser();
    if (user) {
      const own = await sb().from("brands").select("*").eq("account_id", user.id).maybeSingle();
      if (own.data) return own.data;
    }
    const demo = await sb().from("brands").select("*").eq("account_id", DEMO).maybeSingle();
    return demo.data ?? null;
  },

  // ===== Mutations (publish/toast stays Phase 6) =====
  async approvePost(id: string) {
    if (USE_MOCK) return;
    const { error } = await sb().from("posts").update({ approval_state: "approved" }).eq("id", id);
    if (error) throw error;
  },

  // Scoped so it can never sweep founder-posted video drafts (CONTRACT §1c/C7).
  async approveAll(channel: ChannelId | "all") {
    if (USE_MOCK) return;
    let q = sb()
      .from("posts")
      .update({ approval_state: "approved" })
      .eq("account_id", DEMO)
      .eq("status", "scheduled")
      .eq("approval_state", "pending");
    if (channel !== "all") q = q.eq("channel", channel);
    const { error } = await q;
    if (error) throw error;
  },

  // Flip filmed AND activate the calendar placeholder (draft→scheduled) (C5).
  async markFilmed(scriptId: string, postId: string) {
    if (USE_MOCK) return;
    const fs = await sb().from("founder_scripts").update({ filmed: true }).eq("id", scriptId);
    if (fs.error) throw fs.error;
    const p = await sb().from("posts").update({ status: "scheduled" }).eq("id", postId).eq("status", "draft");
    if (p.error) throw p.error;
  },
};

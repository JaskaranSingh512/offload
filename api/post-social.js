import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

const CHANNEL_LABELS = {
  instagram: "Instagram",
  tiktok:    "TikTok",
  reddit:    "Reddit",
  x:         "X",
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { campaign_id, account_id } = req.body;
  if (!campaign_id) return res.status(400).json({ error: "campaign_id required" });
  if (!account_id)  return res.status(400).json({ error: "account_id required" });

  // Fetch all pending posts for this campaign
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, channel, content, status")
    .eq("campaign_id", campaign_id)
    .eq("account_id", account_id)
    .eq("approval_state", "pending");

  if (error) return res.status(500).json({ error: error.message });
  if (!posts?.length) return res.status(404).json({ error: "No pending posts found for this campaign" });

  // Mark all as approved + published
  const { error: updateError } = await supabase
    .from("posts")
    .update({
      status:         "published",
      approval_state: "approved",
      published_at:   new Date().toISOString(),
    })
    .eq("campaign_id", campaign_id)
    .eq("account_id", account_id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  const channel      = posts[0].channel;
  const channelLabel = CHANNEL_LABELS[channel] ?? channel;
  const slideCount   = posts.length;
  const caption      = posts[0].content?.caption ?? "";
  const imageUrls    = posts.map((p) => p.content?.image_url).filter(Boolean);

  res.json({
    success:       true,
    channel,
    slides_posted: slideCount,
    caption,
    image_urls:    imageUrls,
    message:       `${slideCount}-slide carousel posted to ${channelLabel} ✓`,
    // Real publishing (OAuth + platform API) is a post-hackathon item.
    // Instagram/TikTok require Meta/TikTok app review (weeks).
    // X posting via API v2 requires Basic plan ($100/mo).
    mock: true,
  });
}

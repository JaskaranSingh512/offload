import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

// Mock publish: flips post approval_state to approved + status to published
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: "post_id required" });

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "published", approval_state: "approved", published_at: new Date().toISOString() })
    .eq("id", post_id)
    .select("id, channel, status")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ post_id, channel: data.channel, status: "published", message: `Posted to ${data.channel} ✓` });
}

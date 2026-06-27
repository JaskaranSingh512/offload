import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock publish: flips post status to 'posted'
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { post_id } = req.body;
  if (!post_id) return res.status(400).json({ error: "post_id required" });

  const { data, error } = await supabase
    .from("posts")
    .update({ status: "posted" })
    .eq("id", post_id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ post_id, status: "posted", message: `Posted to ${data.project_id} ✓` });
}

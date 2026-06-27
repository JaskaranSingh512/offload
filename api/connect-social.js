import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mock: flips social_connections.status to 'connected'
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { user_id, provider } = req.body;
  if (!user_id || !provider) return res.status(400).json({ error: "user_id and provider required" });

  const { data, error } = await supabase
    .from("social_connections")
    .upsert({ user_id, provider, status: "connected" }, { onConflict: "user_id,provider" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ provider, status: "connected" });
}

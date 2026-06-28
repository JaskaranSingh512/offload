import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY
);

// Mock: flips social_accounts.status to 'mock' for non-Canva providers
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { account_id, provider } = req.body;
  if (!account_id) return res.status(400).json({ error: "account_id required" });
  if (!provider)   return res.status(400).json({ error: "provider required" });

  const { data, error } = await supabase
    .from("social_accounts")
    .upsert(
      { account_id, provider, status: "mock", read_scope: true },
      { onConflict: "account_id,provider" }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ provider, status: data.status });
}

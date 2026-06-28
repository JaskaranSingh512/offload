import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Server-only service-role client. Bypasses RLS for trusted server writes (e.g. the
// /api/analyze brand upsert). NEVER import this from a Client Component — it holds the
// secret key. Always resolve the account_id from the session yourself before writing.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

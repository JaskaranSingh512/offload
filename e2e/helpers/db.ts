import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role Supabase client + assertion helpers for the LIVE e2e project's DB-state checks.
// This is test-only: the service-role key bypasses RLS, so it is exclusively used to read back
// rows the app wrote (verifying approvals/publishes/filmed flips actually landed). It mirrors
// lib/supabase/admin.ts (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY).

type Db = SupabaseClient<Database>;
type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type FounderScriptRow = Database["public"]["Tables"]["founder_scripts"]["Row"];

let _admin: Db | null = null;

/**
 * Typed service-role client (bypasses RLS). Reuses a single instance per process.
 * Throws a clear error if the LIVE env vars are missing so the `live` project fails loudly
 * rather than silently reading nothing.
 */
export function adminDb(): Db {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url) throw new Error("adminDb: NEXT_PUBLIC_SUPABASE_URL is not set (required for the live e2e project).");
  if (!secret) throw new Error("adminDb: SUPABASE_SECRET_KEY is not set (required for the live e2e project).");
  _admin = createClient<Database>(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

/** Count rows in `posts` for an account (uses a head count, no rows fetched). */
export async function countPosts(accountId: string): Promise<number> {
  const { count, error } = await adminDb()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("account_id", accountId);
  if (error) throw error;
  return count ?? 0;
}

/** Fetch a single `posts` row by primary key (returns null if absent). */
export async function getPost(id: string): Promise<PostRow | null> {
  const { data, error } = await adminDb().from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/**
 * Assert a post is approved.
 * `approval_state` lives on the `posts` row — Database["public"]["Tables"]["posts"]["Row"]
 * has `approval_state: Database["public"]["Enums"]["approval_t"] | null` where
 * approval_t = "pending" | "approved" | "rejected". Returns true iff it equals "approved".
 */
export async function isPostApproved(id: string): Promise<boolean> {
  const post = await getPost(id);
  return post?.approval_state === "approved";
}

/**
 * Assert the founder script for a post has been filmed.
 * The `filmed` truth lives on `founder_scripts.filmed` (boolean | null), NOT on `posts` —
 * Database["public"]["Tables"]["founder_scripts"]["Row"] is the only row with a `filmed` column.
 * Video posts get a paired founder_scripts row (founder_scripts.post_id → posts.id), and
 * api.markFilmedByPost flips that flag. Returns true iff the joined script's `filmed` is true.
 */
export async function isScriptFilmedByPost(postId: string): Promise<boolean> {
  const { data, error } = await adminDb()
    .from("founder_scripts")
    .select("filmed")
    .eq("post_id", postId)
    .maybeSingle();
  if (error) throw error;
  return (data as Pick<FounderScriptRow, "filmed"> | null)?.filmed === true;
}

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

// Browser Supabase client (Client Components). Uses the publishable/anon key + the
// user's session cookie, so RLS resolves as auth.uid(). Never import server secrets here.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

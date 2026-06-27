import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

// Server Supabase client (Server Components / Route Handlers) that acts AS the user,
// reading + writing the session cookies. RLS resolves as auth.uid(). For server writes
// that must bypass RLS, use a dedicated service-role admin client instead (Phase 4+).
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — safe to ignore when middleware
            // refreshes the session. (We refresh on the callback route + client.)
          }
        },
      },
    },
  );
}

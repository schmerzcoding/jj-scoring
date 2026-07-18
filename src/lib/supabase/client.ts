import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AppSupabaseClient = SupabaseClient<any, "public", any>;

export function createClient(): AppSupabaseClient {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as AppSupabaseClient;
}

/**
 * Supabase SSR can infer `.update()` / `.insert()` as `never` during production builds.
 * Use this helper for all write operations (insert, update, delete).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromTable(supabase: AppSupabaseClient, table: string): any {
  return supabase.from(table);
}

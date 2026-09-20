import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { Competition } from "@/types/database";

export const WADDLE_CUP_EVENT_NAME = "The Waddle Cup";

export function waddleCupEventPath(eventId: string): string {
  return `/competitions/${eventId}`;
}

export async function fetchWaddleCupEvent(
  supabase: AppSupabaseClient
): Promise<Competition | null> {
  const configuredId = process.env.NEXT_PUBLIC_WADDLE_CUP_EVENT_ID?.trim();

  if (configuredId) {
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", configuredId)
      .maybeSingle();

    if (data) return data;
  }

  const { data } = await supabase
    .from("competitions")
    .select("*")
    .ilike("name", WADDLE_CUP_EVENT_NAME)
    .maybeSingle();

  return data;
}

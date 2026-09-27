import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { Competition } from "@/types/database";

export const WADDLE_CUP_EVENT_NAME = "The Waddle Cup";
export const WADDLE_CUP_LANDING_PATH = "/waddle-cup";

export type WaddleCupEvents = {
  congress: Competition | null;
  competition: Competition | null;
};

export function waddleCupLandingPath(): string {
  return WADDLE_CUP_LANDING_PATH;
}

/** Promo block + navbar link — independent of auth and event RLS. */
export function isWaddleCupPromoVisible(): boolean {
  return process.env.NEXT_PUBLIC_WADDLE_CUP_PROMO_VISIBLE !== "false";
}

export function waddleCupEventPath(eventId: string): string {
  return `/competitions/${eventId}`;
}

export function waddleCupEventIds(events: WaddleCupEvents): string[] {
  return [events.congress?.id, events.competition?.id].filter(
    (id): id is string => Boolean(id)
  );
}

export async function fetchWaddleCupEvents(
  supabase: AppSupabaseClient
): Promise<WaddleCupEvents> {
  const congressId = process.env.NEXT_PUBLIC_WADDLE_CUP_CONGRESS_EVENT_ID?.trim();
  const competitionId =
    process.env.NEXT_PUBLIC_WADDLE_CUP_COMPETITION_EVENT_ID?.trim();
  const legacyId = process.env.NEXT_PUBLIC_WADDLE_CUP_EVENT_ID?.trim();

  let congress: Competition | null = null;
  let competition: Competition | null = null;

  const configuredIds = [congressId, competitionId, legacyId].filter(
    Boolean
  ) as string[];

  if (configuredIds.length > 0) {
    const { data } = await supabase
      .from("competitions")
      .select("*")
      .in("id", configuredIds);

    for (const row of data ?? []) {
      if (row.id === congressId) congress = row;
      if (row.id === competitionId) competition = row;
      if (row.id === legacyId && !congress && !competition) {
        if (row.event_type === "competition") competition = row;
        else congress = row;
      }
    }
  }

  const { data: byName } = await supabase
    .from("competitions")
    .select("*")
    .ilike("name", `%${WADDLE_CUP_EVENT_NAME}%`);

  for (const row of byName ?? []) {
    if (row.event_type === "congress" && !congress) congress = row;
    if (row.event_type === "competition" && !competition) competition = row;
  }

  if (!congress && !competition) {
    const { data: exactName } = await supabase
      .from("competitions")
      .select("*")
      .ilike("name", WADDLE_CUP_EVENT_NAME)
      .maybeSingle();

    if (exactName) {
      if (exactName.event_type === "competition") competition = exactName;
      else congress = exactName;
    }
  }

  return { congress, competition };
}

/** @deprecated Prefer fetchWaddleCupEvents — returns congress, else competition. */
export async function fetchWaddleCupEvent(
  supabase: AppSupabaseClient
): Promise<Competition | null> {
  const events = await fetchWaddleCupEvents(supabase);
  return events.congress ?? events.competition;
}

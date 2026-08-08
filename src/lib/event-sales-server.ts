import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  attachSalesToEvents,
  type EventWithSales,
} from "@/lib/event-sales";

type AppSupabase = SupabaseClient<Database>;

export async function fetchEventsWithSales(
  supabase: AppSupabase,
  options: { createdBy?: string } = {}
): Promise<EventWithSales[]> {
  let eventsQuery = supabase
    .from("competitions")
    .select("*")
    .order("event_date", { ascending: true, nullsFirst: false });

  if (options.createdBy) {
    eventsQuery = eventsQuery.eq("created_by", options.createdBy);
  }

  const { data: events, error: eventsError } = await eventsQuery;
  if (eventsError || !events?.length) {
    return [];
  }

  const eventIds = events.map((event) => event.id);
  const { data: purchases, error: purchasesError } = await supabase
    .from("ticket_purchases")
    .select("competition_id, amount_cents, status, role")
    .in("competition_id", eventIds);

  if (purchasesError) {
    return attachSalesToEvents(events, new Map());
  }

  const statsByEvent = new Map<
    string,
    {
      ticketsSold: number;
      revenueCents: number;
      leaderSold: number;
      followerSold: number;
    }
  >();

  for (const purchase of purchases ?? []) {
    if (purchase.status !== "paid") continue;

    const current = statsByEvent.get(purchase.competition_id) ?? {
      ticketsSold: 0,
      revenueCents: 0,
      leaderSold: 0,
      followerSold: 0,
    };

    current.ticketsSold += 1;
    current.revenueCents += purchase.amount_cents;
    if (purchase.role === "leader") current.leaderSold += 1;
    if (purchase.role === "follower") current.followerSold += 1;

    statsByEvent.set(purchase.competition_id, current);
  }

  return attachSalesToEvents(events, statsByEvent);
}

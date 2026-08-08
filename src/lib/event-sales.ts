import type { Competition, EventType } from "@/types/database";
import { isCompetitionEvent } from "@/lib/events";

export type EventSalesStats = {
  ticketsSold: number;
  revenueCents: number;
  leaderSold: number;
  followerSold: number;
};

export type EventWithSales = Competition & {
  sales: EventSalesStats;
};

export const EMPTY_SALES_STATS: EventSalesStats = {
  ticketsSold: 0,
  revenueCents: 0,
  leaderSold: 0,
  followerSold: 0,
};

export function eventUsesRoleTickets(eventType: EventType): boolean {
  return isCompetitionEvent(eventType);
}

export function aggregateEventSales(
  purchases: {
    competition_id: string;
    amount_cents: number;
    status: string;
    role: "leader" | "follower" | null;
  }[]
): Map<string, EventSalesStats> {
  const statsByEvent = new Map<string, EventSalesStats>();

  for (const purchase of purchases) {
    if (purchase.status !== "paid") continue;

    const current = statsByEvent.get(purchase.competition_id) ?? {
      ...EMPTY_SALES_STATS,
    };

    current.ticketsSold += 1;
    current.revenueCents += purchase.amount_cents;
    if (purchase.role === "leader") current.leaderSold += 1;
    if (purchase.role === "follower") current.followerSold += 1;

    statsByEvent.set(purchase.competition_id, current);
  }

  return statsByEvent;
}

export function attachSalesToEvents(
  events: Competition[],
  statsByEvent: Map<string, EventSalesStats>
): EventWithSales[] {
  return events.map((event) => ({
    ...event,
    sales: statsByEvent.get(event.id) ?? { ...EMPTY_SALES_STATS },
  }));
}

export function sumSalesStats(events: EventWithSales[]): EventSalesStats {
  return events.reduce(
    (total, event) => ({
      ticketsSold: total.ticketsSold + event.sales.ticketsSold,
      revenueCents: total.revenueCents + event.sales.revenueCents,
      leaderSold: total.leaderSold + event.sales.leaderSold,
      followerSold: total.followerSold + event.sales.followerSold,
    }),
    { ...EMPTY_SALES_STATS }
  );
}

import type { AppSupabaseClient } from "@/lib/supabase/client";
import type {
  Competition,
  CompetitionStatus,
  TicketPurchase,
} from "@/types/database";

export type TicketWithEvent = TicketPurchase & {
  competition: Competition;
};

const UPCOMING_EVENT_STATUSES: CompetitionStatus[] = [
  "open",
  "closed",
  "in_progress",
];

const PAST_EVENT_STATUSES: CompetitionStatus[] = ["completed"];

export async function fetchProfileTickets(
  supabase: AppSupabaseClient,
  userId: string
): Promise<{ upcoming: TicketWithEvent[]; past: TicketWithEvent[] }> {
  const { data: purchases } = await supabase
    .from("ticket_purchases")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "paid")
    .order("purchased_at", { ascending: false });

  if (!purchases?.length) {
    return { upcoming: [], past: [] };
  }

  const competitionIds = [...new Set(purchases.map((p) => p.competition_id))];
  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .in("id", competitionIds);

  const competitionById = new Map(
    competitions?.map((competition) => [competition.id, competition]) ?? []
  );

  const withEvent: TicketWithEvent[] = purchases
    .map((purchase) => {
      const competition = competitionById.get(purchase.competition_id);
      if (!competition) return null;
      return { ...purchase, competition };
    })
    .filter((row): row is TicketWithEvent => row !== null);

  const upcoming = withEvent.filter((ticket) =>
    UPCOMING_EVENT_STATUSES.includes(ticket.competition.status)
  );

  const past = withEvent.filter((ticket) =>
    PAST_EVENT_STATUSES.includes(ticket.competition.status)
  );

  return { upcoming, past };
}

import type { AppSupabaseClient } from "@/lib/supabase/client";
import type {
  Competition,
  CompetitionStatus,
  TicketPurchase,
} from "@/types/database";

export type TicketWithEvent = TicketPurchase & {
  competition: Competition;
  ticketTypeName: string | null;
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
  const ticketTypeIds = [
    ...new Set(
      purchases.map((purchase) => purchase.ticket_type_id).filter(Boolean)
    ),
  ] as string[];

  const [{ data: competitions }, { data: ticketTypes }] = await Promise.all([
    supabase.from("competitions").select("*").in("id", competitionIds),
    ticketTypeIds.length > 0
      ? supabase.from("ticket_types").select("id, name").in("id", ticketTypeIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const competitionById = new Map(
    competitions?.map((competition) => [competition.id, competition]) ?? []
  );
  const ticketTypeNameById = new Map(
    ticketTypes?.map((ticketType) => [ticketType.id, ticketType.name]) ?? []
  );

  const withEvent: TicketWithEvent[] = purchases
    .map((purchase) => {
      const competition = competitionById.get(purchase.competition_id);
      if (!competition) return null;
      return {
        ...purchase,
        competition,
        ticketTypeName: purchase.ticket_type_id
          ? (ticketTypeNameById.get(purchase.ticket_type_id) ?? null)
          : null,
      };
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

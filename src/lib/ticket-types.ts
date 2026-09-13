import type { AppSupabaseClient } from "@/lib/supabase/client";
import {
  eventHasPaidTickets as eventHasLegacyPaidTickets,
  parseEuroInputToCents,
} from "@/lib/ticket-pricing";
import type { Competition, TicketPassType, TicketType } from "@/types/database";

export type TicketTypeDraft = {
  key: string;
  name: string;
  description: string;
  priceEuro: string;
  passType: TicketPassType;
};

export const PASS_TYPE_OPTIONS: { value: TicketPassType; label: string }[] = [
  { value: "standard", label: "General admission" },
  { value: "social_pass", label: "Social pass" },
  { value: "jj_pass", label: "J&J pass" },
  { value: "full_pass", label: "Full pass" },
];

export function createEmptyTicketTypeDraft(
  passType: TicketPassType = "standard"
): TicketTypeDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    priceEuro: "",
    passType,
  };
}

export function defaultPassTypeForEvent(
  eventType: Competition["event_type"]
): TicketPassType {
  if (eventType === "social") return "social_pass";
  if (eventType === "congress") return "full_pass";
  if (eventType === "competition") return "jj_pass";
  return "standard";
}

export async function fetchActiveTicketTypes(
  supabase: AppSupabaseClient,
  competitionId: string
): Promise<TicketType[]> {
  const { data } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at");

  return data ?? [];
}

export async function fetchAllTicketTypes(
  supabase: AppSupabaseClient,
  competitionId: string
): Promise<TicketType[]> {
  const { data } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("competition_id", competitionId)
    .order("sort_order")
    .order("created_at");

  return data ?? [];
}

export function eventHasTicketTypes(types: TicketType[]): boolean {
  return types.some((type) => type.is_active && type.price_cents > 0);
}

export function eventHasAnyPaidTickets(
  event: Pick<
    Competition,
    | "event_type"
    | "ticket_price_cents"
    | "leader_price_cents"
    | "follower_price_cents"
  >,
  ticketTypes: TicketType[]
): boolean {
  return eventHasTicketTypes(ticketTypes) || eventHasLegacyPaidTickets(event);
}

export function getTicketTypeLabel(
  ticketType: Pick<TicketType, "name"> | null | undefined,
  fallback: string
): string {
  return ticketType?.name?.trim() || fallback;
}

export function hasPaidTicketDrafts(drafts: TicketTypeDraft[]): boolean {
  return drafts.some((draft) => {
    const priceCents = parseEuroInputToCents(draft.priceEuro);
    return Boolean(draft.name.trim()) && priceCents != null && priceCents > 0;
  });
}

export async function insertTicketTypesFromDrafts(
  supabase: AppSupabaseClient,
  competitionId: string,
  drafts: TicketTypeDraft[]
): Promise<{ error?: string }> {
  const rows = drafts
    .map((draft, index) => {
      const priceCents = parseEuroInputToCents(draft.priceEuro);
      if (!draft.name.trim() || priceCents == null || priceCents <= 0) {
        return null;
      }
      return {
        competition_id: competitionId,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price_cents: priceCents,
        pass_type: draft.passType,
        sort_order: index,
        is_active: true,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  if (rows.length === 0) return {};

  const { error } = await supabase.from("ticket_types").insert(rows);
  return { error: error?.message };
}

export async function insertCompetitionTicketTypes(
  supabase: AppSupabaseClient,
  competitionId: string,
  leaderPriceCents: number | null,
  followerPriceCents: number | null
): Promise<{ error?: string }> {
  const rows = [];

  if (leaderPriceCents != null && leaderPriceCents > 0) {
    rows.push({
      competition_id: competitionId,
      name: "Leader pass",
      price_cents: leaderPriceCents,
      pass_type: "jj_pass" as const,
      role: "leader" as const,
      sort_order: 0,
      is_active: true,
    });
  }

  if (followerPriceCents != null && followerPriceCents > 0) {
    rows.push({
      competition_id: competitionId,
      name: "Follower pass",
      price_cents: followerPriceCents,
      pass_type: "jj_pass" as const,
      role: "follower" as const,
      sort_order: 1,
      is_active: true,
    });
  }

  if (rows.length === 0) return {};

  const { error } = await supabase.from("ticket_types").insert(rows);
  return { error: error?.message };
}

export async function insertSingleTicketType(
  supabase: AppSupabaseClient,
  competitionId: string,
  name: string,
  priceCents: number,
  passType: TicketPassType
): Promise<{ error?: string }> {
  if (priceCents <= 0) return {};

  const { error } = await supabase.from("ticket_types").insert({
    competition_id: competitionId,
    name,
    price_cents: priceCents,
    pass_type: passType,
    sort_order: 0,
    is_active: true,
  });

  return { error: error?.message };
}

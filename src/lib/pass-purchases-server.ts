import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, RegistrationRole, TicketPassType } from "@/types/database";

type AppSupabase = SupabaseClient<Database>;

export type PaidPassPurchaseRow = {
  id: string;
  purchasedAt: string;
  passType: TicketPassType;
  role: RegistrationRole | null;
  amountCents: number;
  passCode: string | null;
  competitionId: string;
  competitionName: string;
  userId: string | null;
  fullName: string;
  avatarUrl: string | null;
};

export async function fetchPaidPassPurchases(
  supabase: AppSupabase,
  options: { createdBy?: string } = {}
): Promise<PaidPassPurchaseRow[]> {
  let competitionIds: string[] | null = null;

  if (options.createdBy) {
    const { data: events } = await supabase
      .from("competitions")
      .select("id")
      .eq("created_by", options.createdBy);

    competitionIds = events?.map((event) => event.id) ?? [];
    if (competitionIds.length === 0) return [];
  }

  let purchasesQuery = supabase
    .from("ticket_purchases")
    .select(
      "id, competition_id, user_id, role, pass_type, amount_cents, pass_code, purchased_at"
    )
    .eq("status", "paid")
    .order("purchased_at", { ascending: false });

  if (competitionIds) {
    purchasesQuery = purchasesQuery.in("competition_id", competitionIds);
  }

  const { data: purchases, error } = await purchasesQuery;
  if (error || !purchases?.length) return [];

  const eventIds = [...new Set(purchases.map((p) => p.competition_id))];
  const userIds = [
    ...new Set(purchases.map((p) => p.user_id).filter(Boolean) as string[]),
  ];

  const [{ data: competitions }, { data: profiles }] = await Promise.all([
    supabase.from("competitions").select("id, name").in("id", eventIds),
    userIds.length > 0
      ? supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string; avatar_url: string | null }[] }),
  ]);

  const competitionById = new Map(competitions?.map((c) => [c.id, c.name]) ?? []);
  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  return purchases.map((purchase) => {
    const profile = purchase.user_id ? profileById.get(purchase.user_id) : null;
    return {
      id: purchase.id,
      purchasedAt: purchase.purchased_at,
      passType: purchase.pass_type,
      role: purchase.role,
      amountCents: purchase.amount_cents,
      passCode: purchase.pass_code,
      competitionId: purchase.competition_id,
      competitionName: competitionById.get(purchase.competition_id) ?? "Unknown event",
      userId: purchase.user_id,
      fullName: profile?.full_name ?? "Unknown buyer",
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

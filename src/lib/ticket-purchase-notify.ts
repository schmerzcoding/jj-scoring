import { createAdminClient } from "@/lib/supabase/admin";
import { getBrevoEmailFailureMessage } from "@/lib/email/brevo";
import { sendTicketPurchaseConfirmedEmail } from "@/lib/email/ticket-purchase-confirmed";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import { getTicketTypeLabel } from "@/lib/ticket-types";
import { getSiteUrl } from "@/lib/stripe";
import { ensureTicketPassCode } from "@/lib/ticket-pass-code";
import { ensureTicketQrToken } from "@/lib/ticket-qr";

const CONFIRMABLE_PASS_TYPES = new Set([
  "social_pass",
  "full_pass",
  "jj_pass",
  "standard",
]);

export async function notifyTicketPurchaseConfirmations(
  purchaseIds: string[],
  request?: Request
): Promise<void> {
  if (purchaseIds.length === 0) return;

  const admin = createAdminClient();
  const siteUrl = getSiteUrl(request);

  const { data: purchases, error } = await admin
    .from("ticket_purchases")
    .select("*")
    .in("id", purchaseIds)
    .eq("status", "paid")
    .is("purchase_confirmation_sent_at", null);

  if (error || !purchases?.length) return;

  const eligiblePurchases = purchases.filter((purchase) =>
    CONFIRMABLE_PASS_TYPES.has(purchase.pass_type)
  );

  if (eligiblePurchases.length === 0) return;

  const purchasesByUser = new Map<string, typeof eligiblePurchases>();
  for (const purchase of eligiblePurchases) {
    if (!purchase.user_id) continue;
    const current = purchasesByUser.get(purchase.user_id) ?? [];
    current.push(purchase);
    purchasesByUser.set(purchase.user_id, current);
  }

  for (const [userId, userPurchases] of purchasesByUser) {
    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(userId);

    const recipientEmail = authUser?.user?.email;
    if (authError || !recipientEmail) {
      console.warn("Purchase confirmation email skipped: user email not found.", userId);
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    const competitionIds = [...new Set(userPurchases.map((purchase) => purchase.competition_id))];
    const { data: competitions } = await admin
      .from("competitions")
      .select("id, name")
      .in("id", competitionIds);

    const competitionNameById = new Map(
      competitions?.map((competition) => [competition.id, competition.name]) ?? []
    );

    const ticketTypeIds = [
      ...new Set(
        userPurchases.map((purchase) => purchase.ticket_type_id).filter(Boolean)
      ),
    ] as string[];

    const { data: ticketTypes } =
      ticketTypeIds.length > 0
        ? await admin.from("ticket_types").select("id, name").in("id", ticketTypeIds)
        : { data: [] as { id: string; name: string }[] };

    const ticketTypeNameById = new Map(
      ticketTypes?.map((ticketType) => [ticketType.id, ticketType.name]) ?? []
    );

    const purchasesByEvent = new Map<string, typeof userPurchases>();
    for (const purchase of userPurchases) {
      const current = purchasesByEvent.get(purchase.competition_id) ?? [];
      current.push(purchase);
      purchasesByEvent.set(purchase.competition_id, current);
    }

    for (const [competitionId, eventPurchases] of purchasesByEvent) {
      const eventName = competitionNameById.get(competitionId) ?? "your event";
      const eventUrl = `${siteUrl}/competitions/${competitionId}`;
      const profileTicketsUrl = `${siteUrl}/profile`;

      const items = [];
      for (const purchase of eventPurchases) {
        await ensureTicketQrToken(admin, purchase.id);
        const passCode = await ensureTicketPassCode(admin, purchase.id);
        if (!passCode) continue;

        const passLabel = getTicketTypeLabel(
          purchase.ticket_type_id
            ? { name: ticketTypeNameById.get(purchase.ticket_type_id) ?? "" }
            : null,
          formatPassTypeLabel(purchase.pass_type, purchase.role)
        );

        items.push({
          passLabel,
          passCode,
          ticketUrl: `${siteUrl}/profile/tickets/${purchase.id}`,
        });
      }

      if (items.length === 0) continue;

      const emailResult = await sendTicketPurchaseConfirmedEmail({
        to: recipientEmail,
        recipientName: profile?.full_name ?? "",
        eventName,
        eventUrl,
        profileTicketsUrl,
        items,
      });

      if (!emailResult.ok) {
        console.error(
          "Purchase confirmation email failed:",
          getBrevoEmailFailureMessage(emailResult)
        );
        continue;
      }

      const sentIds = eventPurchases.map((purchase) => purchase.id);
      await admin
        .from("ticket_purchases")
        .update({ purchase_confirmation_sent_at: new Date().toISOString() })
        .in("id", sentIds)
        .is("purchase_confirmation_sent_at", null);
    }
  }
}

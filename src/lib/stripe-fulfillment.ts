import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCompetitionEvent } from "@/lib/events";
import { resolvePassTypeForPurchase } from "@/lib/ticket-pass";
import { ensureTicketQrToken, generateQrToken } from "@/lib/ticket-qr";
import type { RegistrationRole, TicketPurchase } from "@/types/database";

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<{ ok: boolean; error?: string }> {
  const checkoutSessionId = session.metadata?.checkout_session_id;

  if (checkoutSessionId) {
    return fulfillCartCheckoutSession(session, checkoutSessionId);
  }

  const purchaseId = session.metadata?.purchase_id;
  if (!purchaseId) {
    return { ok: false, error: "Checkout session missing purchase metadata." };
  }

  return fulfillSinglePurchase(session, purchaseId);
}

async function fulfillCartCheckoutSession(
  session: Stripe.Checkout.Session,
  checkoutSessionId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: purchases, error: purchasesError } = await admin
    .from("ticket_purchases")
    .select("*")
    .eq("checkout_session_id", checkoutSessionId);

  if (purchasesError || !purchases?.length) {
    return {
      ok: false,
      error: purchasesError?.message ?? "Cart purchases not found.",
    };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  for (const purchase of purchases) {
    if (purchase.status === "paid") {
      await ensureTicketQrToken(admin, purchase.id);
      continue;
    }

    const passType = await resolvePassTypeForPurchaseRow(admin, purchase);

    const { error: updateError } = await admin
      .from("ticket_purchases")
      .update({
        status: "paid",
        pass_type: passType,
        qr_token: purchase.qr_token ?? generateQrToken(),
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        purchased_at: new Date().toISOString(),
      })
      .eq("id", purchase.id);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    await ensureTicketQrToken(admin, purchase.id);
    await maybeCreateCompetitionRegistration(admin, purchase);
  }

  await admin
    .from("checkout_sessions")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq("id", checkoutSessionId);

  return { ok: true };
}

async function fulfillSinglePurchase(
  session: Stripe.Checkout.Session,
  purchaseId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: purchase, error: purchaseError } = await admin
    .from("ticket_purchases")
    .select("*")
    .eq("id", purchaseId)
    .single();

  if (purchaseError || !purchase) {
    return {
      ok: false,
      error: purchaseError?.message ?? "Ticket purchase not found.",
    };
  }

  if (purchase.status === "paid") {
    await ensureTicketQrToken(admin, purchase.id);
    return { ok: true };
  }

  const passType = await resolvePassTypeForPurchaseRow(admin, purchase);

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateError } = await admin
    .from("ticket_purchases")
    .update({
      status: "paid",
      pass_type: passType,
      qr_token: purchase.qr_token ?? generateQrToken(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      purchased_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  await ensureTicketQrToken(admin, purchase.id);
  await maybeCreateCompetitionRegistration(admin, purchase);

  return { ok: true };
}

async function resolvePassTypeForPurchaseRow(
  admin: ReturnType<typeof createAdminClient>,
  purchase: TicketPurchase
) {
  if (purchase.ticket_type_id) {
    const { data: ticketType } = await admin
      .from("ticket_types")
      .select("pass_type")
      .eq("id", purchase.ticket_type_id)
      .single();

    if (ticketType?.pass_type) {
      return ticketType.pass_type;
    }
  }

  const { data: competition } = await admin
    .from("competitions")
    .select("event_type")
    .eq("id", purchase.competition_id)
    .single();

  return competition
    ? resolvePassTypeForPurchase(
        competition.event_type,
        purchase.role as RegistrationRole | null
      )
    : "standard";
}

async function maybeCreateCompetitionRegistration(
  admin: ReturnType<typeof createAdminClient>,
  purchase: TicketPurchase
) {
  const { data: competition } = await admin
    .from("competitions")
    .select("event_type")
    .eq("id", purchase.competition_id)
    .single();

  if (
    !competition ||
    !isCompetitionEvent(competition.event_type) ||
    !purchase.user_id ||
    !purchase.role
  ) {
    return;
  }

  const { data: existingRegistration } = await admin
    .from("registrations")
    .select("id")
    .eq("competition_id", purchase.competition_id)
    .eq("user_id", purchase.user_id)
    .maybeSingle();

  if (existingRegistration) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", purchase.user_id)
    .single();

  const { error: registrationError } = await admin.from("registrations").insert({
    competition_id: purchase.competition_id,
    user_id: purchase.user_id,
    role: purchase.role as RegistrationRole,
    status: "pending",
    display_name: profile?.full_name ?? null,
  });

  if (registrationError) {
    console.error("Failed to create registration after payment:", registrationError);
  }
}

export async function confirmCheckoutSessionById(
  sessionId: string
): Promise<{ ok: boolean; error?: string }> {
  const { getStripe } = await import("@/lib/stripe");
  const session = await getStripe().checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return { ok: false, error: "Payment not completed yet." };
  }

  return fulfillCheckoutSession(session);
}

import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCompetitionEvent } from "@/lib/events";
import type { RegistrationRole } from "@/types/database";

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session
): Promise<{ ok: boolean; error?: string }> {
  const purchaseId = session.metadata?.purchase_id;
  if (!purchaseId) {
    return { ok: false, error: "Checkout session missing purchase_id metadata." };
  }

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
    return { ok: true };
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  const { error: updateError } = await admin
    .from("ticket_purchases")
    .update({
      status: "paid",
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      purchased_at: new Date().toISOString(),
    })
    .eq("id", purchase.id);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

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
    return { ok: true };
  }

  const { data: existingRegistration } = await admin
    .from("registrations")
    .select("id")
    .eq("competition_id", purchase.competition_id)
    .eq("user_id", purchase.user_id)
    .maybeSingle();

  if (existingRegistration) {
    return { ok: true };
  }

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

  return { ok: true };
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

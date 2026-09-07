import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { isCompetitionEvent } from "@/lib/events";
import { resolveTicketPriceCents } from "@/lib/ticket-pricing";
import type { RegistrationRole } from "@/types/database";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      competitionId?: string;
      role?: RegistrationRole;
    };

    const competitionId = body.competitionId;
    if (!competitionId) {
      return NextResponse.json({ error: "Missing event id." }, { status: 400 });
    }

    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (competitionError || !competition) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    if (!competition.registration_open) {
      return NextResponse.json(
        { error: "Ticket sales are not open for this event." },
        { status: 400 }
      );
    }

    const isCompetition = isCompetitionEvent(competition.event_type);
    const role = isCompetition ? body.role : null;

    if (isCompetition && !role) {
      return NextResponse.json(
        { error: "Please select leader or follower." },
        { status: 400 }
      );
    }

    const amountCents = resolveTicketPriceCents(competition, role);
    if (amountCents == null || amountCents <= 0) {
      return NextResponse.json(
        { error: "This event does not have paid tickets configured." },
        { status: 400 }
      );
    }

    const { data: existingPurchase } = await supabase
      .from("ticket_purchases")
      .select("id")
      .eq("competition_id", competitionId)
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already have a ticket for this event." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: purchase, error: purchaseError } = await admin
      .from("ticket_purchases")
      .insert({
        competition_id: competitionId,
        user_id: user.id,
        role,
        amount_cents: amountCents,
        currency: "EUR",
        status: "pending",
      })
      .select("id")
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: purchaseError?.message ?? "Could not create ticket purchase." },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    const siteUrl = getSiteUrl(request);
    const roleLabel =
      role === "leader" ? "Leader pass" : role === "follower" ? "Follower pass" : "Ticket";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `${competition.name} — ${roleLabel}`,
              description: "Waddle Social event ticket",
            },
          },
        },
      ],
      metadata: {
        purchase_id: purchase.id,
        competition_id: competitionId,
        user_id: user.id,
        role: role ?? "",
      },
      success_url: `${siteUrl}/competitions/${competitionId}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/competitions/${competitionId}?checkout=cancelled`,
    });

    await admin
      .from("ticket_purchases")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", purchase.id);

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start Stripe Checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}

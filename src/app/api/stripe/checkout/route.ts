import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl, getStripe } from "@/lib/stripe";
import { isCompetitionEvent } from "@/lib/events";
import { resolveTicketPriceCents } from "@/lib/ticket-pricing";
import type {
  Competition,
  EventType,
  RegistrationRole,
  TicketType,
} from "@/types/database";

type CartItem = {
  ticketTypeId: string;
  quantity: number;
};

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
      items?: CartItem[];
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

    const cartItems = normalizeCartItems(body.items);
    if (cartItems.length > 0) {
      return handleCartCheckout({
        request,
        supabase,
        user,
        competition,
        cartItems,
      });
    }

    return handleLegacyCheckout({
      request,
      supabase,
      user,
      competition,
      role: body.role,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}

function normalizeCartItems(items: CartItem[] | undefined): CartItem[] {
  if (!items?.length) return [];

  const byType = new Map<string, number>();
  for (const item of items) {
    if (!item.ticketTypeId || !Number.isFinite(item.quantity)) continue;
    const quantity = Math.max(0, Math.min(10, Math.floor(item.quantity)));
    if (quantity <= 0) continue;
    byType.set(item.ticketTypeId, (byType.get(item.ticketTypeId) ?? 0) + quantity);
  }

  return [...byType.entries()].map(([ticketTypeId, quantity]) => ({
    ticketTypeId,
    quantity,
  }));
}

async function handleCartCheckout({
  request,
  supabase,
  user,
  competition,
  cartItems,
}: {
  request: Request;
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null };
  competition: { id: string; name: string };
  cartItems: CartItem[];
}) {
  const typeIds = cartItems.map((item) => item.ticketTypeId);
  const { data: ticketTypes, error: typesError } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("competition_id", competition.id)
    .in("id", typeIds);

  if (typesError || !ticketTypes?.length) {
    return NextResponse.json({ error: "Ticket passes not found." }, { status: 404 });
  }

  const typeById = new Map(ticketTypes.map((type) => [type.id, type]));

  for (const item of cartItems) {
    const ticketType = typeById.get(item.ticketTypeId);
    if (!ticketType || !ticketType.is_active || ticketType.price_cents <= 0) {
      return NextResponse.json(
        { error: "One or more selected passes are unavailable." },
        { status: 400 }
      );
    }
  }

  const { data: existingPurchases } = await supabase
    .from("ticket_purchases")
    .select("ticket_type_id")
    .eq("competition_id", competition.id)
    .eq("user_id", user.id)
    .eq("status", "paid");

  const ownedTypeIds = new Set(
    existingPurchases?.map((purchase) => purchase.ticket_type_id).filter(Boolean) ?? []
  );

  for (const item of cartItems) {
    if (ownedTypeIds.has(item.ticketTypeId)) {
      const ticketType = typeById.get(item.ticketTypeId)!;
      return NextResponse.json(
        { error: `You already own the "${ticketType.name}" pass.` },
        { status: 400 }
      );
    }
  }

  const lineItems = cartItems.map((item) => {
    const ticketType = typeById.get(item.ticketTypeId)!;
    return {
      ticketType,
      quantity: item.quantity,
      subtotalCents: ticketType.price_cents * item.quantity,
    };
  });

  const totalCents = lineItems.reduce((sum, line) => sum + line.subtotalCents, 0);
  if (totalCents <= 0) {
    return NextResponse.json({ error: "Cart total must be greater than zero." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: checkoutSession, error: checkoutSessionError } = await admin
    .from("checkout_sessions")
    .insert({
      competition_id: competition.id,
      user_id: user.id,
      total_cents: totalCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (checkoutSessionError || !checkoutSession) {
    return NextResponse.json(
      { error: checkoutSessionError?.message ?? "Could not create checkout session." },
      { status: 500 }
    );
  }

  const purchaseRows = lineItems.flatMap((line) =>
    Array.from({ length: line.quantity }, () => ({
      competition_id: competition.id,
      user_id: user.id,
      ticket_type_id: line.ticketType.id,
      checkout_session_id: checkoutSession.id,
      role: line.ticketType.role,
      pass_type: line.ticketType.pass_type,
      amount_cents: line.ticketType.price_cents,
      currency: "EUR",
      status: "pending" as const,
    }))
  );

  const { data: purchases, error: purchaseError } = await admin
    .from("ticket_purchases")
    .insert(purchaseRows)
    .select("id");

  if (purchaseError || !purchases?.length) {
    return NextResponse.json(
      { error: purchaseError?.message ?? "Could not create ticket purchases." },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  const siteUrl = getSiteUrl(request);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    line_items: lineItems.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: "eur",
        unit_amount: line.ticketType.price_cents,
        product_data: {
          name: `${competition.name} — ${line.ticketType.name}`,
          description: line.ticketType.description ?? "Waddle Social event ticket",
        },
      },
    })),
    metadata: {
      checkout_session_id: checkoutSession.id,
      competition_id: competition.id,
      user_id: user.id,
      purchase_ids: purchases.map((purchase) => purchase.id).join(","),
    },
    success_url: `${siteUrl}/competitions/${competition.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/competitions/${competition.id}?checkout=cancelled`,
  });

  await admin
    .from("checkout_sessions")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", checkoutSession.id);

  await admin
    .from("ticket_purchases")
    .update({ stripe_checkout_session_id: session.id })
    .eq("checkout_session_id", checkoutSession.id);

  if (!session.url) {
    return NextResponse.json(
      { error: "Could not start Stripe Checkout." },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: session.url });
}

async function handleLegacyCheckout({
  request,
  supabase,
  user,
  competition,
  role,
}: {
  request: Request;
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string | null };
  competition: Pick<
    Competition,
    | "id"
    | "name"
    | "event_type"
    | "ticket_price_cents"
    | "leader_price_cents"
    | "follower_price_cents"
  >;
  role?: RegistrationRole;
}) {
  const isCompetition = isCompetitionEvent(competition.event_type as EventType);
  const selectedRole = isCompetition ? role : null;

  if (isCompetition && !selectedRole) {
    return NextResponse.json(
      { error: "Please select leader or follower." },
      { status: 400 }
    );
  }

  const { data: ticketTypes } = await supabase
    .from("ticket_types")
    .select("*")
    .eq("competition_id", competition.id)
    .eq("is_active", true);

  let ticketType: TicketType | undefined;
  if (ticketTypes?.length) {
    if (isCompetition && selectedRole) {
      ticketType = ticketTypes.find((type) => type.role === selectedRole);
    } else {
      ticketType = ticketTypes[0];
    }
  }

  const amountCents =
    ticketType?.price_cents ??
    resolveTicketPriceCents(competition, selectedRole);

  if (amountCents == null || amountCents <= 0) {
    return NextResponse.json(
      { error: "This event does not have paid tickets configured." },
      { status: 400 }
    );
  }

  if (ticketType) {
    const { data: existingTypePurchase } = await supabase
      .from("ticket_purchases")
      .select("id")
      .eq("competition_id", competition.id)
      .eq("user_id", user.id)
      .eq("ticket_type_id", ticketType.id)
      .eq("status", "paid")
      .maybeSingle();

    if (existingTypePurchase) {
      return NextResponse.json(
        { error: "You already have this pass for the event." },
        { status: 400 }
      );
    }
  } else {
    const { data: existingPurchase } = await supabase
      .from("ticket_purchases")
      .select("id")
      .eq("competition_id", competition.id)
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();

    if (existingPurchase) {
      return NextResponse.json(
        { error: "You already have a ticket for this event." },
        { status: 400 }
      );
    }
  }

  const admin = createAdminClient();
  const { data: purchase, error: purchaseError } = await admin
    .from("ticket_purchases")
    .insert({
      competition_id: competition.id,
      user_id: user.id,
      ticket_type_id: ticketType?.id ?? null,
      role: selectedRole,
      pass_type: ticketType?.pass_type ?? "standard",
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
    selectedRole === "leader"
      ? "Leader pass"
      : selectedRole === "follower"
        ? "Follower pass"
        : ticketType?.name ?? "Ticket";

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
      competition_id: competition.id,
      user_id: user.id,
      role: selectedRole ?? "",
    },
    success_url: `${siteUrl}/competitions/${competition.id}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/competitions/${competition.id}?checkout=cancelled`,
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
}

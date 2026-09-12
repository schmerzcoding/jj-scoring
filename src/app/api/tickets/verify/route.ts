import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canManageEvent } from "@/lib/permissions";
import { formatPassTypeLabel } from "@/lib/ticket-pass";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    token?: string;
    competitionId?: string;
  };

  const token = body.token?.trim();
  const competitionId = body.competitionId;

  if (!token || !competitionId) {
    return NextResponse.json(
      { error: "Missing scan token or event id." },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, name, created_by")
    .eq("id", competitionId)
    .single();

  if (!competition || !profile) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (!canManageEvent(user.id, profile.role, competition)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: ticket, error: ticketError } = await admin
    .from("ticket_purchases")
    .select("*")
    .eq("qr_token", token)
    .eq("competition_id", competitionId)
    .maybeSingle();

  if (ticketError || !ticket) {
    return NextResponse.json(
      { error: "Ticket not found for this event." },
      { status: 404 }
    );
  }

  if (ticket.status !== "paid") {
    return NextResponse.json(
      { error: "This ticket is not valid for entry." },
      { status: 400 }
    );
  }

  let attendeeName = "Guest";
  if (ticket.user_id) {
    const { data: attendeeProfile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", ticket.user_id)
      .single();
    attendeeName = attendeeProfile?.full_name ?? attendeeName;
  }

  const passTypeLabel = formatPassTypeLabel(ticket.pass_type, ticket.role);
  const alreadyCheckedIn = Boolean(ticket.checked_in_at);

  if (!alreadyCheckedIn) {
    const { error: checkInError } = await admin
      .from("ticket_purchases")
      .update({
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq("id", ticket.id);

    if (checkInError) {
      return NextResponse.json(
        { error: "Could not record check-in." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    attendeeName,
    passTypeLabel,
    eventName: competition.name,
    alreadyCheckedIn,
    checkedInAt: alreadyCheckedIn ? ticket.checked_in_at : new Date().toISOString(),
  });
}

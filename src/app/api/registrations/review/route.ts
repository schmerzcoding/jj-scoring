import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { competitionUsesApplyBeforePay } from "@/lib/competition-registration";
import { getBrevoEmailFailureMessage } from "@/lib/email/brevo";
import { sendRegistrationApprovedEmail } from "@/lib/email/registration-approved";
import { sendRegistrationRejectedEmail } from "@/lib/email/registration-rejected";
import { eventHasAnyPaidTickets } from "@/lib/ticket-types";
import { canManageEvent } from "@/lib/permissions";
import { getSiteUrl } from "@/lib/stripe";

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
      registrationId?: string;
      status?: "approved" | "rejected" | "withdrawn";
      rejectionReason?: string;
    };

    const registrationId = body.registrationId;
    const status = body.status;

    if (
      !registrationId ||
      (status !== "approved" && status !== "rejected" && status !== "withdrawn")
    ) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { data: registration, error: registrationError } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", registrationId)
      .single();

    if (registrationError || !registration) {
      return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    const { data: competition, error: competitionError } = await supabase
      .from("competitions")
      .select("*")
      .eq("id", registration.competition_id)
      .single();

    if (competitionError || !competition) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!canManageEvent(user.id, profile?.role, competition)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status === "withdrawn" && registration.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved registrations can be removed from the competition." },
        { status: 400 }
      );
    }

    if (status === "approved" && registration.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending registrations can be approved." },
        { status: 400 }
      );
    }

    if (status === "rejected" && registration.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending registrations can be rejected." },
        { status: 400 }
      );
    }

    const rejectionReason = body.rejectionReason?.trim() ?? "";
    if (status === "rejected" && !rejectionReason) {
      return NextResponse.json(
        { error: "Please provide a reason for the rejection." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: status === "rejected" ? rejectionReason : null,
      })
      .eq("id", registrationId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    let emailWarning: string | undefined;

    if (status === "approved") {
      const { data: ticketTypes } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("competition_id", competition.id);

      const hasPaidTickets = eventHasAnyPaidTickets(competition, ticketTypes ?? []);
      const requiresPayment = competitionUsesApplyBeforePay(competition, hasPaidTickets);

      if (requiresPayment) {
        const admin = createAdminClient();
        const { data: authUser, error: authError } =
          await admin.auth.admin.getUserById(registration.user_id);

        const recipientEmail = authUser?.user?.email;
        const { data: participantProfile } = await admin
          .from("profiles")
          .select("full_name")
          .eq("id", registration.user_id)
          .single();

        if (authError || !recipientEmail) {
          emailWarning = "Registration approved, but the participant email could not be found.";
        } else {
          const siteUrl = getSiteUrl(request);
          const emailResult = await sendRegistrationApprovedEmail({
            to: recipientEmail,
            recipientName:
              registration.display_name ?? participantProfile?.full_name ?? "",
            competitionName: competition.name,
            competitionUrl: `${siteUrl}/competitions/${competition.id}`,
          });

          if (!emailResult.ok) {
            emailWarning = `Registration approved, but the approval email could not be sent. ${getBrevoEmailFailureMessage(emailResult)}`;
          }
        }
      }
    }

    if (status === "rejected") {
      const admin = createAdminClient();
      const { data: authUser, error: authError } =
        await admin.auth.admin.getUserById(registration.user_id);

      const recipientEmail = authUser?.user?.email;
      const { data: participantProfile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", registration.user_id)
        .single();

      if (authError || !recipientEmail) {
        emailWarning = "Registration rejected, but the participant email could not be found.";
      } else {
        const siteUrl = getSiteUrl(request);
        const emailResult = await sendRegistrationRejectedEmail({
          to: recipientEmail,
          recipientName:
            registration.display_name ?? participantProfile?.full_name ?? "",
          competitionName: competition.name,
          competitionUrl: `${siteUrl}/competitions/${competition.id}`,
          reason: rejectionReason,
        });

        if (!emailResult.ok) {
          emailWarning = `Registration rejected, but the notification email could not be sent. ${getBrevoEmailFailureMessage(emailResult)}`;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      emailWarning,
    });
  } catch (error) {
    console.error("Registration review error:", error);
    return NextResponse.json(
      { error: "Could not update registration." },
      { status: 500 }
    );
  }
}

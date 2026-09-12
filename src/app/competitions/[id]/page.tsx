import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { EventTypeBadge } from "@/components/event-type-badge";
import { EventWorkshopSummary } from "@/components/event-workshop-summary";
import { Button } from "@/components/ui/button";
import { formatEventSchedule } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";
import { canPurchaseEventTicket, canRegisterForCompetitions } from "@/lib/auth";
import { eventHasPaidTickets } from "@/lib/ticket-pricing";
import { formatPassTypeLabel } from "@/lib/ticket-pass";
import { RegistrationForm } from "./registration-form";
import { TicketPurchaseForm } from "@/components/ticket-purchase-form";
import { CheckoutSuccessSync } from "@/components/checkout-success-sync";
import { Leaderboard } from "@/components/leaderboard";
import { getPublishedRoundLeaderboards } from "@/lib/leaderboard-server";
import { isCompetitionEvent } from "@/lib/events";
import type { ParticipantRow } from "@/lib/leaderboard";

export default async function CompetitionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const { id } = await params;
  const { checkout, session_id: sessionId } = await searchParams;
  const supabase = await createClient();

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();

  if (!competition) notFound();

  const isCompetition = isCompetitionEvent(competition.event_type);
  const hasPaidTickets = eventHasPaidTickets(competition);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role, profile_completed")
      .eq("id", user.id)
      .single();
    userProfile = data;
  }

  let existingRegistration = null;
  if (user) {
    const { data } = await supabase
      .from("registrations")
      .select("*")
      .eq("competition_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    existingRegistration = data;
  }

  let existingTicketPurchase = null;
  if (user) {
    const { data } = await supabase
      .from("ticket_purchases")
      .select("*")
      .eq("competition_id", id)
      .eq("user_id", user.id)
      .eq("status", "paid")
      .maybeSingle();
    existingTicketPurchase = data;
  }

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const { data: approvedRegistrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("competition_id", id)
    .eq("status", "approved");

  const userIds = [...new Set(approvedRegistrations?.map((r) => r.user_id) ?? [])];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };

  const profileById = new Map(profiles?.map((p) => [p.id, p]) ?? []);
  const participants: ParticipantRow[] =
    approvedRegistrations?.map((registration) => ({
      id: registration.id,
      role: registration.role,
      display_name: registration.display_name,
      profile: profileById.get(registration.user_id) ?? null,
    })) ?? [];

  const publishedLeaderboards = await getPublishedRoundLeaderboards(
    supabase,
    id,
    rounds ?? [],
    participants
  );

  const hasPublishedRounds = (rounds ?? []).some(
    (round) => round.leaderboard_published
  );
  const hasCompletedRounds = (rounds ?? []).some(
    (round) => round.status === "completed"
  );

  return (
    <div className="space-y-8">
      {checkout === "success" && sessionId && (
        <CheckoutSuccessSync sessionId={sessionId} />
      )}
      {checkout === "success" && (
        <div className="alert-banner">
          Payment received. Your ticket is confirmed
          {isCompetition ? " and your registration is pending approval." : "."}
        </div>
      )}
      {checkout === "cancelled" && (
        <div className="alert-banner alert-banner-muted">
          Checkout was cancelled. You can try again when you are ready.
        </div>
      )}

      {competition.banner_url && (
        <div className="overflow-hidden rounded-2xl border border-border shadow-lg shadow-black/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={competition.banner_url}
            alt=""
            className="aspect-[3/1] w-full object-cover"
          />
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-foreground">
                {competition.name}
              </h1>
              <EventTypeBadge type={competition.event_type ?? "competition"} />
            </div>
            {competition.description && (
              <p className="mt-2 text-muted">{competition.description}</p>
            )}
          </div>
          <StatusBadge status={competition.status} />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          {competition.country_code && (
            <span>{getCountryName(competition.country_code)}</span>
          )}
          {competition.location && <span>{competition.location}</span>}
          <span>
            {formatEventSchedule(
              competition.event_date,
              competition.start_time,
              competition.end_time
            )}
          </span>
        </div>
        <div className="mt-4">
          <EventWorkshopSummary event={competition} />
        </div>
      </div>

      {competition.registration_open &&
        user &&
        hasPaidTickets &&
        !existingTicketPurchase &&
        canPurchaseEventTicket(userProfile, isCompetition) && (
          <TicketPurchaseForm event={competition} />
        )}

      {hasPaidTickets &&
        !competition.registration_open &&
        !existingTicketPurchase && (
          <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-foreground">Tickets</h2>
            <p className="mt-2 text-sm text-muted">
              Ticket sales are not open for this event yet.
            </p>
          </div>
        )}

      {!hasPaidTickets &&
        !isCompetition &&
        competition.status === "open" &&
        !existingTicketPurchase && (
          <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-foreground">Free event</h2>
            <p className="mt-2 text-sm text-muted">
              No ticket purchase is required for this event.
            </p>
          </div>
        )}

      {competition.registration_open &&
        user &&
        hasPaidTickets &&
        !existingTicketPurchase &&
        userProfile &&
        !canPurchaseEventTicket(userProfile, isCompetition) && (
          <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-foreground">Buy a ticket</h2>
            <p className="mt-2 text-sm text-muted">
              {isCompetition
                ? "Complete your dancer profile before purchasing a ticket."
                : "Your account cannot purchase tickets for this event."}
            </p>
            {isCompetition && (
              <Link href="/profile/setup" className="mt-4 inline-block">
                <Button>Complete profile</Button>
              </Link>
            )}
          </div>
        )}

      {competition.registration_open && !user && hasPaidTickets && (
        <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
          <h2 className="font-semibold text-foreground">Tickets available</h2>
          <p className="mt-2 text-sm text-muted">Log in or create an account to buy a ticket.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary">Sign up</Button>
            </Link>
          </div>
        </div>
      )}

      {existingTicketPurchase && (
        <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
          <h2 className="font-semibold text-foreground">Your ticket</h2>
          <p className="mt-2 text-sm text-muted">
            Payment confirmed —{" "}
            {formatPassTypeLabel(
              existingTicketPurchase.pass_type ?? "standard",
              existingTicketPurchase.role
            )}
            .
          </p>
          <Link href={`/profile/tickets/${existingTicketPurchase.id}`} className="mt-4 inline-block">
            <Button>View QR code</Button>
          </Link>
        </div>
      )}

      {isCompetition && competition.registration_open &&
        user &&
        !hasPaidTickets &&
        !existingRegistration &&
        canRegisterForCompetitions(userProfile) && (
          <RegistrationForm competitionId={id} />
        )}

      {isCompetition && competition.registration_open &&
        user &&
        !hasPaidTickets &&
        !existingRegistration &&
        userProfile &&
        !canRegisterForCompetitions(userProfile) && (
          <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
            <h2 className="font-semibold text-foreground">Register for this competition</h2>
            <p className="mt-2 text-sm text-muted">
              Complete your dancer profile before signing up for a competition.
            </p>
            <Link href="/profile/setup" className="mt-4 inline-block">
              <Button>Complete profile</Button>
            </Link>
          </div>
        )}

      {isCompetition && existingRegistration && (
        <div className="rounded-2xl border border-border bg-surface-overlay p-6 shadow-lg shadow-black/20">
          <h2 className="font-semibold text-foreground">Your Registration</h2>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-sm capitalize text-muted">
              Role: {existingRegistration.role}
            </span>
            <StatusBadge status={existingRegistration.status} />
          </div>
          {existingRegistration.status === "pending" && (
            <p className="mt-2 text-sm text-muted">
              Your registration is pending admin approval.
            </p>
          )}
        </div>
      )}

      {isCompetition && rounds && rounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground">Rounds</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="rounded-xl border border-border bg-surface-overlay p-4 transition-colors hover:border-brand-800/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{round.name}</span>
                  <StatusBadge status={round.status} />
                </div>
                <p className="mt-1 text-xs capitalize text-muted">
                  {round.role_type}
                </p>
                {round.leaderboard_published && (
                  <p className="mt-2 text-xs font-medium text-emerald-400">
                    Results published
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isCompetition &&
        (hasPublishedRounds || hasCompletedRounds || publishedLeaderboards.length > 0) && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Results</h2>
          {publishedLeaderboards.length === 0 ? (
            <p className="text-sm text-muted">
              {hasCompletedRounds
                ? "Results are being finalized. Check back soon."
                : "Results will appear here once rounds are completed."}
            </p>
          ) : (
            publishedLeaderboards.map(({ round, entries }) => (
              <Leaderboard
                key={round.id}
                title={round.name}
                entries={entries}
                showAdvanced={false}
                scoringFormat={round.scoring_format ?? "numeric"}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

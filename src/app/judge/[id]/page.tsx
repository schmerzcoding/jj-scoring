import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ScoringPanel } from "./scoring-panel";
import { Leaderboard } from "@/components/leaderboard";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getAdvancedIdsForRound,
  getLeaderboardForRoundServer,
} from "@/lib/leaderboard-server";
import {
  competitionUsesApplyBeforePay,
  filterConfirmedRegistrations,
} from "@/lib/competition-registration";
import { eventHasAnyPaidTickets, fetchActiveTicketTypes } from "@/lib/ticket-types";
import { getEligibleParticipants } from "@/lib/leaderboard";
import { participantsForJudge } from "@/lib/scoring-formats";
import type { ParticipantRow } from "@/lib/leaderboard";

export default async function JudgeCompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: competition } = await supabase
    .from("competitions")
    .select("*")
    .eq("id", id)
    .single();
  if (!competition) notFound();

  const { data: judgeAssignment } = await supabase
    .from("competition_judges")
    .select("judge_role")
    .eq("competition_id", id)
    .eq("judge_id", user.id)
    .maybeSingle();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const activeRound = rounds?.find((r) => r.status === "active");

  const ticketTypes = await fetchActiveTicketTypes(supabase, id);
  const hasPaidTickets = eventHasAnyPaidTickets(competition, ticketTypes);
  const applyBeforePay = competitionUsesApplyBeforePay(competition, hasPaidTickets);

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("competition_id", id)
    .eq("status", "approved");

  const { data: paidPurchases } = await supabase
    .from("ticket_purchases")
    .select("*")
    .eq("competition_id", id)
    .eq("status", "paid");

  const confirmedRegistrations = filterConfirmedRegistrations(
    registrations ?? [],
    paidPurchases ?? [],
    applyBeforePay
  );

  const participantIds = [...new Set(confirmedRegistrations.map((r) => r.user_id))];
  const { data: participantProfiles } =
    participantIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", participantIds)
      : { data: [] as { id: string; full_name: string }[] };

  const participantProfileById = new Map(
    participantProfiles?.map((p) => [p.id, p]) ?? []
  );
  const participants: ParticipantRow[] = confirmedRegistrations.map((registration) => ({
    id: registration.id,
    role: registration.role,
    display_name: registration.display_name,
    profile: participantProfileById.get(registration.user_id) ?? null,
  }));

  let filteredRegistrations = participants;
  if (activeRound) {
    const advancedIds = await getAdvancedIdsForRound(
      supabase,
      rounds ?? [],
      activeRound
    );
    filteredRegistrations = getEligibleParticipants(
      activeRound,
      rounds ?? [],
      participants,
      advancedIds
    );
    filteredRegistrations = participantsForJudge(
      filteredRegistrations,
      activeRound.scoring_format,
      judgeAssignment?.judge_role ?? null
    );
  }

  let existingScores: Record<string, { score: number; advanceVote: boolean | null }> =
    {};
  if (activeRound) {
    const { data: scores } = await supabase
      .from("scores")
      .select("registration_id, score, advance_vote")
      .eq("round_id", activeRound.id)
      .eq("judge_id", user.id);

    if (scores) {
      existingScores = Object.fromEntries(
        scores.map((s) => [
          s.registration_id,
          {
            score: Number(s.score),
            advanceVote: s.advance_vote,
          },
        ])
      );
    }
  }

  const leaderboardRounds =
    rounds?.filter(
      (round) => round.status === "completed" || round.id === activeRound?.id
    ) ?? [];

  const roundLeaderboards = await Promise.all(
    leaderboardRounds.map(async (round) => ({
      round,
      entries: await getLeaderboardForRoundServer(
        supabase,
        round,
        rounds ?? [],
        participants
      ),
    }))
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/judge" className="text-sm text-brand-400 hover:text-brand-300 hover:underline">
          &larr; Back to judge panel
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          {competition.name}
        </h1>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground">Rounds</h2>
        <div className="mt-3 flex flex-wrap gap-2 stagger-children">
          {rounds?.map((round) => (
            <div
              key={round.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface-overlay px-4 py-2"
            >
              <span className="text-sm font-medium text-foreground">{round.name}</span>
              <StatusBadge status={round.status} />
            </div>
          ))}
        </div>
      </div>

      {activeRound ? (
        <ScoringPanel
          roundId={activeRound.id}
          roundName={activeRound.name}
          judgeId={user.id}
          participants={filteredRegistrations}
          scoringFormat={activeRound.scoring_format ?? "placement"}
          existingScores={existingScores}
        />
      ) : (
        <EmptyState
          icon="rounds"
          title="No active round"
          description="Wait for the organizer to activate a round before you can start scoring."
          compact
        />
      )}

      {roundLeaderboards.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-foreground">Leaderboards</h2>
          {roundLeaderboards.map(({ round, entries }) => (
            <Leaderboard
              key={round.id}
              title={round.name}
              entries={entries}
              showAdvanced={round.status === "completed"}
              scoringFormat={round.scoring_format ?? "placement"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

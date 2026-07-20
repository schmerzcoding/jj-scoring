import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { ScoringPanel } from "./scoring-panel";
import { Leaderboard } from "@/components/leaderboard";
import {
  getAdvancedIdsForRound,
  getLeaderboardForRoundServer,
} from "@/lib/leaderboard-server";
import { getEligibleParticipants } from "@/lib/leaderboard";
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

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", id)
    .order("order_index");

  const activeRound = rounds?.find((r) => r.status === "active");

  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("competition_id", id)
    .eq("status", "approved");

  const participantIds = [...new Set(registrations?.map((r) => r.user_id) ?? [])];
  const { data: participantProfiles } =
    participantIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", participantIds)
      : { data: [] as { id: string; full_name: string }[] };

  const participantProfileById = new Map(
    participantProfiles?.map((p) => [p.id, p]) ?? []
  );
  const participants: ParticipantRow[] =
    registrations?.map((registration) => ({
      id: registration.id,
      role: registration.role,
      display_name: registration.display_name,
      profile: participantProfileById.get(registration.user_id) ?? null,
    })) ?? [];

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
        <Link href="/judge" className="text-sm text-brand-600 hover:underline">
          &larr; Back to judge panel
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          {competition.name}
        </h1>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Rounds</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {rounds?.map((round) => (
            <div
              key={round.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2"
            >
              <span className="text-sm font-medium">{round.name}</span>
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
          scoringFormat={activeRound.scoring_format ?? "numeric"}
          existingScores={existingScores}
        />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500">
            No active round. Wait for the admin to activate a round.
          </p>
        </div>
      )}

      {roundLeaderboards.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Leaderboards</h2>
          {roundLeaderboards.map(({ round, entries }) => (
            <Leaderboard
              key={round.id}
              title={round.name}
              entries={entries}
              showAdvanced={round.status === "completed"}
              scoringFormat={round.scoring_format ?? "numeric"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

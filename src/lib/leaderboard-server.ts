import {
  buildLeaderboard,
  getEligibleParticipants,
  getPreviousRound,
  type LeaderboardEntry,
  type ParticipantRow,
} from "@/lib/leaderboard";
import { standingsToLeaderboard } from "@/lib/round-actions";
import type { AppSupabaseClient } from "@/lib/supabase/client";
import type { Round } from "@/types/database";

export async function getAdvancedIdsForRound(
  supabase: AppSupabaseClient,
  allRounds: Round[],
  round: Round
): Promise<Set<string>> {
  const previousRound = getPreviousRound(allRounds, round);
  if (!previousRound) return new Set();

  const { data } = await supabase
    .from("round_standings")
    .select("registration_id")
    .eq("round_id", previousRound.id)
    .eq("advanced", true);

  return new Set(data?.map((row) => row.registration_id) ?? []);
}

export async function getLeaderboardForRoundServer(
  supabase: AppSupabaseClient,
  round: Round,
  allRounds: Round[],
  participants: ParticipantRow[] = []
): Promise<LeaderboardEntry[]> {
  const { data: standings } = await supabase
    .from("round_standings")
    .select("*")
    .eq("round_id", round.id)
    .order("rank_in_role");

  if (standings && standings.length > 0) {
    const nameById =
      participants.length > 0
        ? new Map(
            participants.map((p) => [
              p.id,
              p.display_name ?? p.profile?.full_name ?? "Unknown",
            ])
          )
        : undefined;
    return standingsToLeaderboard(
      standings,
      nameById,
      round.scoring_format ?? "numeric"
    );
  }

  if (round.status !== "completed") {
    const advancedIds = await getAdvancedIdsForRound(supabase, allRounds, round);
    const eligible = getEligibleParticipants(
      round,
      allRounds,
      participants,
      advancedIds
    );

    const { data: scores } = await supabase
      .from("scores")
      .select("registration_id, score, advance_vote")
      .eq("round_id", round.id);

    return buildLeaderboard(
      eligible,
      scores ?? [],
      round.max_advance_leaders,
      round.max_advance_followers,
      round.scoring_format ?? "numeric"
    );
  }

  return [];
}

export async function getPublishedRoundLeaderboards(
  supabase: AppSupabaseClient,
  competitionId: string,
  allRounds: Round[],
  participants: ParticipantRow[] = []
) {
  const publishedRounds = allRounds.filter(
    (round) => round.leaderboard_published === true
  );

  if (!publishedRounds.length) return [];

  const results = [];
  for (const round of publishedRounds) {
    const entries = await getLeaderboardForRoundServer(
      supabase,
      round,
      allRounds,
      participants
    );

    results.push({ round, entries });
  }

  return results;
}

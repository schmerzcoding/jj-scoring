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
  participants: ParticipantRow[]
): Promise<LeaderboardEntry[]> {
  if (round.status === "completed") {
    const { data: standings } = await supabase
      .from("round_standings")
      .select("*")
      .eq("round_id", round.id)
      .order("rank_in_role");

    if (standings && standings.length > 0) {
      const nameById = new Map(
        participants.map((p) => [
          p.id,
          p.display_name ?? p.profile?.full_name ?? "Unknown",
        ])
      );
      return standingsToLeaderboard(standings, nameById);
    }
  }

  const advancedIds = await getAdvancedIdsForRound(supabase, allRounds, round);
  const eligible = getEligibleParticipants(
    round,
    allRounds,
    participants,
    advancedIds
  );

  const { data: scores } = await supabase
    .from("scores")
    .select("registration_id, score")
    .eq("round_id", round.id);

  return buildLeaderboard(
    eligible,
    scores ?? [],
    round.max_advance_leaders,
    round.max_advance_followers
  );
}

export async function getPublishedRoundLeaderboards(
  supabase: AppSupabaseClient,
  competitionId: string,
  participants: ParticipantRow[]
) {
  const { data: rounds } = await supabase
    .from("rounds")
    .select("*")
    .eq("competition_id", competitionId)
    .eq("leaderboard_published", true)
    .order("order_index");

  if (!rounds?.length) return [];

  const nameById = new Map(
    participants.map((p) => [
      p.id,
      p.display_name ?? p.profile?.full_name ?? "Unknown",
    ])
  );

  const results = [];
  for (const round of rounds) {
    const { data: standings } = await supabase
      .from("round_standings")
      .select("*")
      .eq("round_id", round.id)
      .order("rank_in_role");

    results.push({
      round,
      entries: standings?.length
        ? standingsToLeaderboard(standings, nameById)
        : [],
    });
  }

  return results;
}

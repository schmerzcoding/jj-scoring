import {
  buildLeaderboard,
  getEligibleParticipants,
  getPreviousRound,
  type LeaderboardEntry,
  type ParticipantRow,
} from "@/lib/leaderboard";
import { normalizeScoringFormat } from "@/lib/scoring-formats";
import { createClient, fromTable, type AppSupabaseClient } from "@/lib/supabase/client";
import type { RegistrationRole, Round, RoundStanding } from "@/types/database";

export function standingsToLeaderboard(
  standings: RoundStanding[],
  nameByRegistrationId?: Map<string, string>,
  scoringFormat: Round["scoring_format"] = "placement"
): LeaderboardEntry[] {
  const normalized = normalizeScoringFormat(scoringFormat);
  return standings
    .map((standing) => ({
      registrationId: standing.registration_id,
      displayName:
        standing.display_name ??
        nameByRegistrationId?.get(standing.registration_id) ??
        "Unknown",
      role: standing.role,
      totalScore: Number(standing.total_score),
      averageScore: Number(standing.average_score),
      judgeCount: standing.judge_count,
      rankInRole: standing.rank_in_role,
      advanced: standing.advanced,
      scoringFormat: normalized,
      yesVotes: standing.yes_votes ?? 0,
      coefficientTotal: Number(standing.coefficient_total ?? 0),
    }))
    .sort((a, b) => {
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.rankInRole - b.rankInRole;
    });
}

export async function fetchJudgeRoles(
  supabase: AppSupabaseClient,
  competitionId: string
): Promise<Map<string, RegistrationRole>> {
  const { data } = await supabase
    .from("competition_judges")
    .select("judge_id, judge_role")
    .eq("competition_id", competitionId);

  return new Map(
    data?.map((row) => [row.judge_id, row.judge_role as RegistrationRole]) ?? []
  );
}

export async function fetchAdvancedIds(
  supabase: AppSupabaseClient,
  previousRoundId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("round_standings")
    .select("registration_id")
    .eq("round_id", previousRoundId)
    .eq("advanced", true);

  return new Set(data?.map((row) => row.registration_id) ?? []);
}

export async function fetchLeaderboardForRound(
  supabase: AppSupabaseClient,
  round: Round,
  allRounds: Round[],
  participants: ParticipantRow[]
): Promise<LeaderboardEntry[]> {
  const scoringFormat = normalizeScoringFormat(round.scoring_format);

  if (round.status === "completed") {
    const { data: standings } = await supabase
      .from("round_standings")
      .select("*")
      .eq("round_id", round.id)
      .order("rank_in_role");

    if (standings && standings.length > 0) {
      const nameById = new Map(
        participants.map((p) => [p.id, p.display_name ?? p.profile?.full_name ?? "Unknown"])
      );
      return standingsToLeaderboard(standings, nameById, scoringFormat);
    }
  }

  const previousRound = getPreviousRound(allRounds, round);
  const advancedIds = previousRound
    ? await fetchAdvancedIds(supabase, previousRound.id)
    : new Set<string>();

  const eligible = getEligibleParticipants(
    round,
    allRounds,
    participants,
    advancedIds
  );

  const judgeRoles = await fetchJudgeRoles(supabase, round.competition_id);

  const { data: scores } = await supabase
    .from("scores")
    .select("registration_id, score, advance_vote, judge_id")
    .eq("round_id", round.id);

  return buildLeaderboard(
    eligible,
    scores ?? [],
    round.max_advance_leaders,
    round.max_advance_followers,
    scoringFormat,
    judgeRoles
  );
}

export async function completeRound(
  round: Round,
  allRounds: Round[],
  participants: ParticipantRow[]
): Promise<{ error?: string; advancedCount?: number }> {
  const supabase = createClient();
  const scoringFormat = normalizeScoringFormat(round.scoring_format);

  const previousRound = getPreviousRound(allRounds, round);
  const advancedIds = previousRound
    ? await fetchAdvancedIds(supabase, previousRound.id)
    : new Set<string>();

  const eligible = getEligibleParticipants(
    round,
    allRounds,
    participants,
    advancedIds
  );

  const judgeRoles = await fetchJudgeRoles(supabase, round.competition_id);

  const { data: scores } = await supabase
    .from("scores")
    .select("registration_id, score, judge_id")
    .eq("round_id", round.id);

  const leaderboard = buildLeaderboard(
    eligible,
    scores ?? [],
    round.max_advance_leaders,
    round.max_advance_followers,
    scoringFormat,
    judgeRoles
  );

  await fromTable(supabase, "round_standings").delete().eq("round_id", round.id);

  if (leaderboard.length > 0) {
    const { error: insertError } = await fromTable(supabase, "round_standings").insert(
      leaderboard.map((entry) => ({
        round_id: round.id,
        registration_id: entry.registrationId,
        display_name: entry.displayName,
        role: entry.role,
        total_score: entry.totalScore,
        average_score: entry.averageScore,
        judge_count: entry.judgeCount,
        rank_in_role: entry.rankInRole,
        advanced: entry.advanced,
        yes_votes: entry.yesVotes,
        coefficient_total: entry.coefficientTotal,
      }))
    );

    if (insertError) {
      return { error: insertError.message };
    }
  }

  await fromTable(supabase, "rounds")
    .update({ status: "completed", leaderboard_published: true })
    .eq("id", round.id);

  return {
    advancedCount: leaderboard.filter((entry) => entry.advanced).length,
  };
}

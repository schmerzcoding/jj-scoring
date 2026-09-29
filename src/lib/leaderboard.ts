import type { RegistrationRole, Round, RoundScoringFormat } from "@/types/database";
import {
  normalizeScoringFormat,
  scoreCountsForParticipant,
  scoringFormatLabel,
} from "@/lib/scoring-formats";

export { scoringFormatLabel };

export interface LeaderboardEntry {
  registrationId: string;
  displayName: string;
  role: RegistrationRole;
  totalScore: number;
  averageScore: number;
  judgeCount: number;
  rankInRole: number;
  advanced: boolean;
  scoringFormat: RoundScoringFormat;
  yesVotes: number;
  coefficientTotal: number;
}

export interface ScoreRow {
  registration_id: string;
  score: number;
  advance_vote?: boolean | null;
  judge_id?: string;
}

export interface ParticipantRow {
  id: string;
  role: RegistrationRole;
  display_name: string | null;
  profile?: { full_name: string } | null;
}

export function displayName(participant: ParticipantRow): string {
  return participant.display_name ?? participant.profile?.full_name ?? "Unknown";
}

function rankEntries(
  entries: LeaderboardEntry[],
  maxAdvanceLeaders: number | null,
  maxAdvanceFollowers: number | null,
  compare: (a: LeaderboardEntry, b: LeaderboardEntry) => number
) {
  const rankGroup = (role: RegistrationRole) => {
    const group = entries.filter((e) => e.role === role).sort(compare);
    const maxAdvance =
      role === "leader" ? maxAdvanceLeaders : maxAdvanceFollowers;

    group.forEach((entry, index) => {
      entry.rankInRole = index + 1;
      if (maxAdvance != null && maxAdvance > 0) {
        entry.advanced = entry.rankInRole <= maxAdvance;
      }
    });
  };

  rankGroup("leader");
  rankGroup("follower");
}

function buildPlacementLeaderboard(
  participants: ParticipantRow[],
  scores: ScoreRow[],
  maxAdvanceLeaders: number | null,
  maxAdvanceFollowers: number | null,
  scoringFormat: RoundScoringFormat,
  judgeRoles: Map<string, RegistrationRole>
): LeaderboardEntry[] {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const score of scores) {
    if (!score.judge_id) continue;

    const participant = participants.find((p) => p.id === score.registration_id);
    if (!participant) continue;

    if (
      !scoreCountsForParticipant(
        scoringFormat,
        participant.role,
        score.judge_id,
        judgeRoles
      )
    ) {
      continue;
    }

    const current = totals.get(score.registration_id) ?? { sum: 0, count: 0 };
    current.sum += Number(score.score);
    current.count += 1;
    totals.set(score.registration_id, current);
  }

  const normalizedFormat = normalizeScoringFormat(scoringFormat);

  const entries: LeaderboardEntry[] = participants.map((participant) => {
    const stats = totals.get(participant.id) ?? { sum: 0, count: 0 };
    return {
      registrationId: participant.id,
      displayName: displayName(participant),
      role: participant.role,
      totalScore: stats.sum,
      averageScore: stats.count > 0 ? stats.sum / stats.count : 0,
      judgeCount: stats.count,
      rankInRole: 0,
      advanced: false,
      scoringFormat: normalizedFormat,
      yesVotes: 0,
      coefficientTotal: 0,
    };
  });

  rankEntries(entries, maxAdvanceLeaders, maxAdvanceFollowers, (a, b) => {
    if (a.averageScore !== b.averageScore) return a.averageScore - b.averageScore;
    if (a.totalScore !== b.totalScore) return a.totalScore - b.totalScore;
    return a.displayName.localeCompare(b.displayName);
  });

  return entries.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.rankInRole - b.rankInRole;
  });
}

function buildVoteLeaderboard(
  participants: ParticipantRow[],
  scores: ScoreRow[],
  maxAdvanceLeaders: number | null,
  maxAdvanceFollowers: number | null
): LeaderboardEntry[] {
  const stats = new Map<
    string,
    { yesVotes: number; coefficientTotal: number; count: number }
  >();

  for (const score of scores) {
    const current = stats.get(score.registration_id) ?? {
      yesVotes: 0,
      coefficientTotal: 0,
      count: 0,
    };
    if (score.advance_vote === true) {
      current.yesVotes += 1;
    }
    current.coefficientTotal += Number(score.score);
    current.count += 1;
    stats.set(score.registration_id, current);
  }

  const entries: LeaderboardEntry[] = participants.map((participant) => {
    const row = stats.get(participant.id) ?? {
      yesVotes: 0,
      coefficientTotal: 0,
      count: 0,
    };
    return {
      registrationId: participant.id,
      displayName: displayName(participant),
      role: participant.role,
      totalScore: row.yesVotes,
      averageScore: row.count > 0 ? row.coefficientTotal / row.count : 0,
      judgeCount: row.count,
      rankInRole: 0,
      advanced: false,
      scoringFormat: "vote_coefficient",
      yesVotes: row.yesVotes,
      coefficientTotal: row.coefficientTotal,
    };
  });

  rankEntries(entries, maxAdvanceLeaders, maxAdvanceFollowers, (a, b) => {
    if (b.yesVotes !== a.yesVotes) return b.yesVotes - a.yesVotes;
    if (b.coefficientTotal !== a.coefficientTotal) {
      return b.coefficientTotal - a.coefficientTotal;
    }
    return a.displayName.localeCompare(b.displayName);
  });

  return entries.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.rankInRole - b.rankInRole;
  });
}

export function buildLeaderboard(
  participants: ParticipantRow[],
  scores: ScoreRow[],
  maxAdvanceLeaders: number | null,
  maxAdvanceFollowers: number | null,
  scoringFormat: RoundScoringFormat = "placement",
  judgeRoles: Map<string, RegistrationRole> = new Map()
): LeaderboardEntry[] {
  const normalized = normalizeScoringFormat(scoringFormat);

  if (normalized === "vote_coefficient") {
    return buildVoteLeaderboard(
      participants,
      scores,
      maxAdvanceLeaders,
      maxAdvanceFollowers
    );
  }

  return buildPlacementLeaderboard(
    participants,
    scores,
    maxAdvanceLeaders,
    maxAdvanceFollowers,
    normalized,
    judgeRoles
  );
}

export function getEligibleParticipants(
  round: Round,
  allRounds: Round[],
  approvedParticipants: ParticipantRow[],
  advancedIds: Set<string>
): ParticipantRow[] {
  const isFirstRound = round.order_index === 0;

  let pool = approvedParticipants;
  if (!isFirstRound) {
    pool = approvedParticipants.filter((p) => advancedIds.has(p.id));
  }

  if (round.role_type === "both") return pool;
  return pool.filter((p) => p.role === round.role_type);
}

export function getPreviousRound(allRounds: Round[], round: Round): Round | null {
  return (
    allRounds
      .filter((r) => r.order_index < round.order_index)
      .sort((a, b) => b.order_index - a.order_index)[0] ?? null
  );
}

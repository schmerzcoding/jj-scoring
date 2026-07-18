import type { RegistrationRole, Round } from "@/types/database";

export interface LeaderboardEntry {
  registrationId: string;
  displayName: string;
  role: RegistrationRole;
  totalScore: number;
  averageScore: number;
  judgeCount: number;
  rankInRole: number;
  advanced: boolean;
}

export interface ScoreRow {
  registration_id: string;
  score: number;
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

export function buildLeaderboard(
  participants: ParticipantRow[],
  scores: ScoreRow[],
  maxAdvanceLeaders: number | null,
  maxAdvanceFollowers: number | null
): LeaderboardEntry[] {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const score of scores) {
    const current = totals.get(score.registration_id) ?? { sum: 0, count: 0 };
    current.sum += Number(score.score);
    current.count += 1;
    totals.set(score.registration_id, current);
  }

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
    };
  });

  const rankGroup = (role: RegistrationRole) => {
    const group = entries
      .filter((e) => e.role === role)
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
        return a.displayName.localeCompare(b.displayName);
      });

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

  return entries.sort((a, b) => {
    if (a.role !== b.role) return a.role.localeCompare(b.role);
    return a.rankInRole - b.rankInRole;
  });
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

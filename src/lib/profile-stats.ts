import type { AppSupabaseClient } from "@/lib/supabase/client";
import type {
  Competition,
  CompetitionStatus,
  Registration,
  RegistrationStatus,
  Round,
  RoundStanding,
} from "@/types/database";

export type RegistrationWithCompetition = Registration & {
  competition: Competition;
};

export type Achievement = {
  id: string;
  competitionId: string;
  competitionName: string;
  roundId: string;
  roundName: string;
  role: Registration["role"];
  rankInRole: number;
  advanced: boolean;
  totalScore: number;
  yesVotes: number;
  coefficientTotal: number;
  scoringFormat: Round["scoring_format"];
  kind: "podium" | "advanced" | "participated";
  label: string;
};

export type ProfileCompetitionData = {
  enrollments: RegistrationWithCompetition[];
  history: RegistrationWithCompetition[];
  achievements: Achievement[];
};

const ACTIVE_COMPETITION_STATUSES: CompetitionStatus[] = [
  "open",
  "closed",
  "in_progress",
];

function buildAchievement(
  standing: RoundStanding,
  round: Round,
  competition: Competition
): Achievement {
  const scoringFormat = round.scoring_format ?? "numeric";
  let kind: Achievement["kind"] = "participated";
  let label = `Competed in ${round.name}`;

  if (standing.advanced) {
    kind = "advanced";
    label = `Advanced from ${round.name}`;
  }

  if (standing.rank_in_role === 1) {
    kind = "podium";
    label = `1st ${standing.role} in ${round.name}`;
  } else if (standing.rank_in_role === 2) {
    kind = "podium";
    label = `2nd ${standing.role} in ${round.name}`;
  } else if (standing.rank_in_role === 3) {
    kind = "podium";
    label = `3rd ${standing.role} in ${round.name}`;
  }

  return {
    id: standing.id,
    competitionId: competition.id,
    competitionName: competition.name,
    roundId: round.id,
    roundName: round.name,
    role: standing.role,
    rankInRole: standing.rank_in_role,
    advanced: standing.advanced,
    totalScore: Number(standing.total_score),
    yesVotes: standing.yes_votes ?? 0,
    coefficientTotal: Number(standing.coefficient_total ?? 0),
    scoringFormat,
    kind,
    label,
  };
}

export async function fetchProfileCompetitionData(
  supabase: AppSupabaseClient,
  userId: string
): Promise<ProfileCompetitionData> {
  const { data: registrations } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!registrations?.length) {
    return { enrollments: [], history: [], achievements: [] };
  }

  const competitionIds = [...new Set(registrations.map((r) => r.competition_id))];
  const { data: competitions } = await supabase
    .from("competitions")
    .select("*")
    .in("id", competitionIds);

  const competitionById = new Map(
    competitions?.map((competition) => [competition.id, competition]) ?? []
  );

  const withCompetition: RegistrationWithCompetition[] = registrations
    .map((registration) => {
      const competition = competitionById.get(registration.competition_id);
      if (!competition) return null;
      return { ...registration, competition };
    })
    .filter((row): row is RegistrationWithCompetition => row !== null);

  const isActiveEnrollment = (registration: RegistrationWithCompetition) =>
    registration.status !== "rejected" &&
    ACTIVE_COMPETITION_STATUSES.includes(registration.competition.status);

  const isHistory = (registration: RegistrationWithCompetition) =>
    registration.status === "approved" &&
    registration.competition.status === "completed";

  const enrollments = withCompetition.filter(isActiveEnrollment);
  const history = withCompetition.filter(isHistory);

  const approvedRegistrationIds = withCompetition
    .filter((registration) => registration.status === "approved")
    .map((registration) => registration.id);

  let achievements: Achievement[] = [];

  if (approvedRegistrationIds.length > 0) {
    const { data: standings } = await supabase
      .from("round_standings")
      .select("*")
      .in("registration_id", approvedRegistrationIds)
      .order("rank_in_role");

    if (standings?.length) {
      const roundIds = [...new Set(standings.map((standing) => standing.round_id))];
      const { data: rounds } = await supabase
        .from("rounds")
        .select("*")
        .in("id", roundIds);

      const roundById = new Map(rounds?.map((round) => [round.id, round]) ?? []);

      achievements = standings
        .map((standing) => {
          const round = roundById.get(standing.round_id);
          if (!round) return null;

          const registration = withCompetition.find(
            (row) => row.id === standing.registration_id
          );
          if (!registration) return null;

          return buildAchievement(
            standing,
            round,
            registration.competition
          );
        })
        .filter((row): row is Achievement => row !== null)
        .sort((a, b) => {
          const kindOrder = { podium: 0, advanced: 1, participated: 2 };
          if (kindOrder[a.kind] !== kindOrder[b.kind]) {
            return kindOrder[a.kind] - kindOrder[b.kind];
          }
          return a.rankInRole - b.rankInRole;
        });
    }
  }

  return { enrollments, history, achievements };
}

export function registrationStatusLabel(status: RegistrationStatus): string {
  const labels: Record<RegistrationStatus, string> = {
    pending: "Pending approval",
    approved: "Approved",
    rejected: "Rejected",
  };
  return labels[status];
}

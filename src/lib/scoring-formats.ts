import type { RegistrationRole, RoundScoringFormat } from "@/types/database";

/** Legacy DB rows may still use `numeric`; treat as placement. */
export function normalizeScoringFormat(
  format: RoundScoringFormat | null | undefined
): RoundScoringFormat {
  if (!format || format === "numeric") return "placement";
  return format;
}

export function isPlacementFormat(format: RoundScoringFormat | null | undefined): boolean {
  const normalized = normalizeScoringFormat(format);
  return normalized === "placement" || normalized === "crossed_placement";
}

export function scoringFormatLabel(format: RoundScoringFormat | null | undefined): string {
  const normalized = normalizeScoringFormat(format);
  switch (normalized) {
    case "vote_coefficient":
      return "Yes/No + coefficient";
    case "crossed_placement":
      return "Crossed placement";
    case "placement":
      return "Placement";
    default:
      return "Placement";
  }
}

export function placementOrdinal(n: number): string {
  const value = Math.round(n);
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export function participantsForJudge<T extends { role: RegistrationRole }>(
  participants: T[],
  scoringFormat: RoundScoringFormat | null | undefined,
  judgeRole: RegistrationRole | null | undefined
): T[] {
  const normalized = normalizeScoringFormat(scoringFormat);
  if (normalized === "crossed_placement") return participants;
  if (isPlacementFormat(normalized) && judgeRole) {
    return participants.filter((p) => p.role === judgeRole);
  }
  return participants;
}

export function scoreCountsForParticipant(
  scoringFormat: RoundScoringFormat | null | undefined,
  participantRole: RegistrationRole,
  judgeId: string,
  judgeRoles: Map<string, RegistrationRole>
): boolean {
  const normalized = normalizeScoringFormat(scoringFormat);
  if (normalized === "crossed_placement") return true;
  if (normalized === "placement") {
    const judgeRole = judgeRoles.get(judgeId);
    return judgeRole != null && judgeRole === participantRole;
  }
  return true;
}

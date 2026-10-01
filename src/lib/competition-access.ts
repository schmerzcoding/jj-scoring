import type { Competition, UserRole } from "@/types/database";

const SANDBOX_NAME_PREFIX = "[SANDBOX]";

export function isSandboxCompetition(
  competition: Pick<Competition, "name">
): boolean {
  return competition.name.startsWith(SANDBOX_NAME_PREFIX);
}

/** Public event pages (/competitions/*) — draft and sandbox are staff-only. */
export function canViewPublicCompetitionPage(
  competition: Pick<Competition, "status" | "name">,
  role: UserRole | undefined,
  options?: { isAssignedJudge?: boolean; isEventOrganizer?: boolean }
): boolean {
  if (role === "admin") return true;
  if (options?.isEventOrganizer) return true;
  if (options?.isAssignedJudge) return true;

  if (competition.status === "draft") return false;
  if (isSandboxCompetition(competition)) return false;

  return true;
}

export const SANDBOX_COMPETITION_NAME_PREFIX = SANDBOX_NAME_PREFIX;

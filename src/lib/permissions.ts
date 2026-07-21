import type { Competition, UserRole } from "@/types/database";

export function isOrganizerRole(role: UserRole | undefined): boolean {
  return role === "organizer";
}

export function canManageEvent(
  userId: string,
  role: UserRole | undefined,
  event: Pick<Competition, "created_by">
): boolean {
  if (role === "admin") return true;
  if (role === "organizer" && event.created_by === userId) return true;
  return false;
}

export function eventManageBasePath(role: UserRole | undefined): string {
  if (role === "organizer") return "/organizer/events";
  return "/admin/competitions";
}

export function eventsListPath(role: UserRole | undefined): string {
  if (role === "organizer") return "/organizer";
  return "/admin";
}

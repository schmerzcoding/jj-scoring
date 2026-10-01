import type { UserRole } from "@/types/database";

export function isFullAdmin(role: UserRole | undefined): boolean {
  return role === "admin";
}

export function isPseudoAdmin(role: UserRole | undefined): boolean {
  return role === "pseudo_admin";
}

/** Can open /admin routes and view platform data. */
export function hasAdminPanelAccess(role: UserRole | undefined): boolean {
  return isFullAdmin(role) || isPseudoAdmin(role);
}

/** Can create, update, or delete via admin tools and APIs. */
export function canPerformAdminWrites(role: UserRole | undefined): boolean {
  return isFullAdmin(role);
}

export const PSEUDO_ADMIN_ROLE_LABEL = "Pseudo Admin";

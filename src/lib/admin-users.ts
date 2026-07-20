import type { UserRole } from "@/types/database";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

export const ASSIGNABLE_ROLES = [
  "participant",
  "judge",
  "organizer",
] as const satisfies readonly UserRole[];

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function roleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Admin",
    judge: "Jurado",
    organizer: "Organizador",
    participant: "Competidor",
  };
  return labels[role];
}

export function canDeleteUser(
  target: AdminUserRow,
  currentUserId: string
): boolean {
  if (target.id === currentUserId) return false;
  if (target.role === "admin") return false;
  return true;
}

import type { UserRole } from "@/types/database";

export type AdminUserRow = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
};

/** Add new assignable roles here — they appear in the admin user role dropdown. */
export const MANAGEABLE_ROLE_OPTIONS: {
  value: UserRole;
  label: string;
  disabled?: boolean;
}[] = [
  { value: "participant", label: "Participant" },
  { value: "judge", label: "Judge" },
  { value: "organizer", label: "Organizer (coming soon)", disabled: true },
];

export function roleLabel(role: UserRole): string {
  const option = MANAGEABLE_ROLE_OPTIONS.find((entry) => entry.value === role);
  if (option) {
    return option.disabled
      ? option.label.replace(/\s*\(coming soon\)$/i, "")
      : option.label;
  }

  const labels: Record<UserRole, string> = {
    admin: "Admin",
    judge: "Judge",
    organizer: "Organizer",
    participant: "Participant",
  };
  return labels[role];
}

export function isRoleAssignable(role: UserRole): boolean {
  const option = MANAGEABLE_ROLE_OPTIONS.find((entry) => entry.value === role);
  return Boolean(option && !option.disabled);
}

export function getRoleSelectOptions(currentRole: UserRole) {
  const options = MANAGEABLE_ROLE_OPTIONS.map((entry) => ({
    value: entry.value,
    label: entry.label,
    disabled: entry.disabled,
  }));

  if (
    currentRole !== "admin" &&
    !options.some((option) => option.value === currentRole)
  ) {
    options.unshift({
      value: currentRole,
      label: roleLabel(currentRole),
      disabled: false,
    });
  }

  return options;
}

export function canDeleteUser(
  target: AdminUserRow,
  currentUserId: string
): boolean {
  if (target.id === currentUserId) return false;
  if (target.role === "admin") return false;
  return true;
}

import { redirect } from "next/navigation";
import {
  canPerformAdminWrites,
  hasAdminPanelAccess,
} from "@/lib/admin-access";
import type { UserRole } from "@/types/database";

export function requireAdminPanelAccess(role: UserRole | undefined): void {
  if (!hasAdminPanelAccess(role)) redirect("/");
}

export function requireFullAdmin(role: UserRole | undefined): void {
  if (!canPerformAdminWrites(role)) redirect("/admin");
}

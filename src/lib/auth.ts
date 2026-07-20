import type { Profile } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

export function needsProfileSetup(
  profile: Pick<Profile, "role" | "profile_completed"> | null
): boolean {
  if (!profile) return true;
  if (profile.role !== "participant") return false;
  return !profile.profile_completed;
}

export function getPostLoginPath(
  profile: Pick<Profile, "role" | "profile_completed"> | null
): string {
  if (profile?.role === "admin") return "/admin";
  if (profile?.role === "judge") return "/judge";
  if (needsProfileSetup(profile)) return "/profile/setup";
  return "/competitions";
}

export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/auth/callback",
] as const;

export function isAuthPublicPath(pathname: string): boolean {
  return AUTH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function isPublicBrowsePath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/competitions") ||
    isAuthPublicPath(pathname)
  );
}

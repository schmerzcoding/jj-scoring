import type { Profile, UserRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";

/** Set to "true" when Brevo + domain + Supabase Confirm email are configured. */
export function requireEmailVerification(): boolean {
  return process.env.NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION === "true";
}

export function isEmailVerified(user: User): boolean {
  if (!requireEmailVerification()) return true;
  return Boolean(user.email_confirmed_at);
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === "admin";
}

/** Non-admin users who can maintain a dancer profile and join competitions. */
export function hasDancerProfile(role: UserRole | undefined): boolean {
  return role !== undefined && !isAdminRole(role);
}

export function needsProfileSetup(
  profile: Pick<Profile, "role" | "profile_completed"> | null
): boolean {
  if (!profile) return true;
  if (isAdminRole(profile.role)) return false;
  return !profile.profile_completed;
}

export function canRegisterForCompetitions(
  profile: Pick<Profile, "role" | "profile_completed"> | null
): boolean {
  if (!profile || isAdminRole(profile.role)) return false;
  return profile.profile_completed;
}

export function getPostLoginPath(
  profile: Pick<Profile, "role" | "profile_completed"> | null
): string {
  if (isAdminRole(profile?.role)) return "/admin";
  if (needsProfileSetup(profile)) return "/profile/setup";
  if (profile?.role === "judge") return "/judge";
  if (profile?.role === "organizer") return "/organizer";
  return "/competitions";
}

export function isAllowedDuringProfileSetup(
  pathname: string,
  role: UserRole | undefined
): boolean {
  if (isAuthPublicPath(pathname)) return true;
  if (pathname === "/profile/setup" || pathname === "/profile") return true;
  if (pathname.startsWith("/competitions")) return true;
  if (role === "judge" && pathname.startsWith("/judge")) return true;
  if (role === "organizer" && pathname.startsWith("/organizer")) return true;
  return false;
}

export const AUTH_PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
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

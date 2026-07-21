export function authCallbackUrl(next: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.waddlesocial.com";

  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

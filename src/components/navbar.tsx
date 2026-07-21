import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserMenu, type UserMenuItem } from "./user-menu";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const displayName = profile?.full_name ?? user?.email ?? "User";

  const userMenuItems: UserMenuItem[] = [];

  if (profile && profile.role !== "admin") {
    userMenuItems.push({
      href: profile.profile_completed ? "/profile" : "/profile/setup",
      label: profile.profile_completed ? "Profile" : "Complete profile",
    });
  }

  userMenuItems.push({
    label: "Log out",
    danger: true,
  });

  const navLinkClass =
    "text-sm text-muted-foreground transition-colors hover:text-brand-400";

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-raised/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-brand-400"
        >
          J<span className="text-brand-500">&</span>J Scoring
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/competitions" className={navLinkClass}>
            Events
          </Link>

          {user && profile?.role === "admin" && (
            <Link href="/admin" className={navLinkClass}>
              Admin
            </Link>
          )}

          {user && profile?.role === "judge" && (
            <Link href="/judge" className={navLinkClass}>
              Judge Panel
            </Link>
          )}

          {user && profile?.role === "organizer" && (
            <Link href="/organizer" className={navLinkClass}>
              Organizer
            </Link>
          )}

          {user ? (
            <UserMenu
              name={displayName}
              avatarUrl={profile?.avatar_url}
              items={userMenuItems}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className={navLinkClass}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-950/40 transition-all hover:bg-brand-500"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import {
  NavbarMobileMenu,
  type MobileNavItem,
} from "@/components/navbar-mobile-menu";
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
    "text-sm font-medium text-white/85 transition-colors hover:text-white";

  const mobileNavItems: MobileNavItem[] = [
    { kind: "link", href: "/competitions", label: "Events" },
  ];

  if (user && profile?.role === "admin") {
    mobileNavItems.push(
      { kind: "link", href: "/admin", label: "Admin" },
      { kind: "link", href: "/admin/sales", label: "Sales" }
    );
  }

  if (user && profile?.role === "judge") {
    mobileNavItems.push({ kind: "link", href: "/judge", label: "Judge Panel" });
  }

  if (user && profile?.role === "organizer") {
    mobileNavItems.push(
      { kind: "link", href: "/organizer", label: "Organizer" },
      { kind: "link", href: "/organizer/sales", label: "Sales" }
    );
  }

  if (user) {
    if (profile && profile.role !== "admin") {
      mobileNavItems.push({
        kind: "link",
        href: profile.profile_completed ? "/profile" : "/profile/setup",
        label: profile.profile_completed ? "Profile" : "Complete profile",
      });
    }
    mobileNavItems.push({ kind: "logout", label: "Log out" });
  } else {
    mobileNavItems.push(
      { kind: "link", href: "/login", label: "Log in" },
      { kind: "link", href: "/signup", label: "Sign up", highlight: true }
    );
  }

  return (
    <header className="navbar-gradient sticky top-0 z-40 shadow-lg shadow-black/30">
      <div className="flex h-14 items-center sm:h-20 md:h-[5.5rem]">
        <Link
          href="/"
          aria-label="Waddle Social home"
          className="flex min-w-0 flex-1 items-center pl-3 transition-opacity hover:opacity-90 sm:flex-none sm:pl-3"
        >
          <BrandLogo />
        </Link>

        <nav className="ml-auto hidden items-center gap-6 pr-4 sm:flex sm:pr-6 lg:pr-8">
          <Link href="/competitions" className={navLinkClass}>
            Events
          </Link>

          {user && profile?.role === "admin" && (
            <>
              <Link href="/admin" className={navLinkClass}>
                Admin
              </Link>
              <Link href="/admin/sales" className={navLinkClass}>
                Sales
              </Link>
            </>
          )}

          {user && profile?.role === "judge" && (
            <Link href="/judge" className={navLinkClass}>
              Judge Panel
            </Link>
          )}

          {user && profile?.role === "organizer" && (
            <>
              <Link href="/organizer" className={navLinkClass}>
                Organizer
              </Link>
              <Link href="/organizer/sales" className={navLinkClass}>
                Sales
              </Link>
            </>
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
                className="rounded-xl bg-brand-700 px-4 py-2 text-sm font-medium text-white shadow-md shadow-black/25 transition-all hover:bg-brand-600"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>

        <div className="shrink-0 pr-3 sm:hidden">
          <NavbarMobileMenu items={mobileNavItems} />
        </div>
      </div>
    </header>
  );
}

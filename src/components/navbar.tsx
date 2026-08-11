import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/brand-logo";
import { MobileNav, type MobileNavLink } from "@/components/mobile-nav";
import type { UserMenuItem } from "./user-menu";

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

  const links: MobileNavLink[] = [{ href: "/competitions", label: "Events" }];

  if (user && profile?.role === "admin") {
    links.push(
      { href: "/admin", label: "Admin" },
      { href: "/admin/sales", label: "Sales" },
    );
  }

  if (user && profile?.role === "judge") {
    links.push({ href: "/judge", label: "Judge Panel" });
  }

  if (user && profile?.role === "organizer") {
    links.push(
      { href: "/organizer", label: "Organizer" },
      { href: "/organizer/sales", label: "Sales" },
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-raised/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          aria-label="Waddle Social home"
          className="text-xl font-bold tracking-tight text-foreground transition-colors hover:text-brand-400"
        >
          <BrandLogo />
        </Link>

        <MobileNav
          links={links}
          authLinks={
            user
              ? undefined
              : [
                  { href: "/login", label: "Log in" },
                  { href: "/signup", label: "Sign up" },
                ]
          }
          user={
            user
              ? {
                  name: displayName,
                  avatarUrl: profile?.avatar_url,
                  items: userMenuItems,
                }
              : null
          }
        />
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { UserMenu, type UserMenuItem } from "./user-menu";

export type MobileNavLink = {
  href: string;
  label: string;
};

export function MobileNav({
  links,
  authLinks,
  user,
}: {
  links: MobileNavLink[];
  authLinks?: MobileNavLink[];
  user?: {
    name: string;
    avatarUrl?: string | null;
    items: UserMenuItem[];
  } | null;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLinkClass =
    "text-sm text-muted-foreground transition-colors hover:text-brand-400";

  return (
    <>
      {/* Desktop */}
      <nav className="hidden items-center gap-6 md:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={navLinkClass}>
            {link.label}
          </Link>
        ))}

        {user ? (
          <UserMenu
            name={user.name}
            avatarUrl={user.avatarUrl}
            items={user.items}
          />
        ) : (
          <div className="flex items-center gap-3">
            {authLinks?.map((link) =>
              link.href === "/signup" ? (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-brand-950/40 transition-all hover:bg-brand-500"
                >
                  {link.label}
                </Link>
              ) : (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              ),
            )}
          </div>
        )}
      </nav>

      {/* Mobile toggle + user avatar */}
      <div className="flex items-center gap-2 md:hidden">
        {user && (
          <UserMenu
            name={user.name}
            avatarUrl={user.avatarUrl}
            items={user.items}
          />
        )}
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-surface-hover"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full z-50 border-b border-border-subtle bg-surface-raised/95 px-4 py-4 backdrop-blur-md md:hidden"
        >
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-base text-foreground transition-colors hover:bg-surface-hover hover:text-brand-400"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {!user &&
              authLinks?.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.href === "/signup"
                      ? "mt-2 rounded-xl bg-brand-600 px-3 py-3 text-center text-base font-medium text-white"
                      : "rounded-xl px-3 py-3 text-base text-foreground transition-colors hover:bg-surface-hover hover:text-brand-400"
                  }
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        </div>
      )}
    </>
  );
}

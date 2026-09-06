"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type MobileNavItem =
  | { kind: "link"; href: string; label: string; highlight?: boolean }
  | { kind: "logout"; label: string };

export function NavbarMobileMenu({ items }: { items: MobileNavItem[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 w-10 items-center justify-center rounded-xl text-white transition-all duration-200 hover:bg-white/10 active:scale-95 ${
          open ? "bg-white/10" : ""
        }`}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="relative block h-5 w-5" aria-hidden>
          <span
            className={`absolute left-1/2 top-1/2 block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-200 ${
              open
                ? "-translate-x-1/2 -translate-y-1/2 rotate-45"
                : "-translate-x-1/2 -translate-y-[calc(50%+6px)]"
            }`}
          />
          <span
            className={`absolute left-1/2 top-1/2 block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-200 ${
              open
                ? "-translate-x-1/2 -translate-y-1/2 scale-x-0 opacity-0"
                : "-translate-x-1/2 -translate-y-1/2"
            }`}
          />
          <span
            className={`absolute left-1/2 top-1/2 block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-200 ${
              open
                ? "-translate-x-1/2 -translate-y-1/2 -rotate-45"
                : "-translate-x-1/2 -translate-y-[calc(50%-6px)]"
            }`}
          />
        </span>
      </button>

      {open && (
        <div className="nav-mobile-dropdown absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface-overlay py-1 shadow-xl shadow-black/40">
          {items.map((item) => {
            if (item.kind === "link") {
              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    item.highlight
                      ? "font-medium text-white hover:bg-brand-700"
                      : "text-foreground hover:bg-surface-hover"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-white/70 transition-colors hover:bg-brand-700 hover:text-white"
                onClick={() => void handleLogout()}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

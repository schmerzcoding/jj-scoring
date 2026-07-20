"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/avatar-upload";

export type UserMenuItem = {
  href?: string;
  label: string;
  onClick?: () => void;
  danger?: boolean;
};

export function UserMenu({
  name,
  avatarUrl,
  items,
}: {
  name: string;
  avatarUrl?: string | null;
  items: UserMenuItem[];
}) {
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

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="max-w-[140px] truncate text-sm font-medium text-gray-700">
          {name}
        </span>
        <UserAvatar name={name} avatarUrl={avatarUrl} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => {
            const className = `block w-full px-4 py-2 text-left text-sm ${
              item.danger
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-50"
            }`;

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  className={className}
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
                role="menuitem"
                className={className}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.label === "Log out") {
                    void handleLogout();
                  }
                  setOpen(false);
                }}
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

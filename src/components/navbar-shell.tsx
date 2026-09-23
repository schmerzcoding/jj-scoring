"use client";

import { useEffect, useState } from "react";

export function NavbarShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`site-navbar sticky top-0 z-40 overflow-visible${
        scrolled ? " site-navbar--scrolled" : ""
      }`}
    >
      {children}
    </header>
  );
}

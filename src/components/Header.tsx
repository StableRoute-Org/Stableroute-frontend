"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ROUTES } from "@/lib/routes";

const navLinks = [
  ROUTES.home,
  ROUTES.pairs,
  ROUTES.quote,
  ROUTES.stats,
  ROUTES.admin,
  ROUTES.events,
  ROUTES.webhooks,
  ROUTES.apiKeys,
  ROUTES.settings,
  ROUTES.docs,
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 p-4">
        <Link
          href="/"
          className="text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]"
        >
          StableRoute
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="rounded border border-neutral-300 px-3 py-1 text-sm md:hidden dark:border-neutral-700"
            aria-expanded={mobileOpen}
            aria-controls="main-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>
      <nav
        id="main-nav"
        aria-label="Main navigation"
        className={`mx-auto max-w-5xl px-4 pb-4 ${mobileOpen ? "block" : "hidden md:block"}`}
      >
        <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-3 md:text-sm">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="block rounded px-2 py-1 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:hover:bg-neutral-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

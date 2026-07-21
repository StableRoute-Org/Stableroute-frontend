"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRoutesByGroup } from "@/lib/routes";

const routeGroups = getRoutesByGroup();

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
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start md:gap-6">
          {routeGroups.map(({ group, routes }, index) => (
            <div
              key={group}
              className={
                index > 0
                  ? "border-t border-neutral-200 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4 dark:border-neutral-800"
                  : undefined
              }
            >
              <span className="block px-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {group}
              </span>
              <ul className="flex flex-col gap-1 md:flex-row md:flex-wrap md:gap-3 md:text-sm">
                {routes.map((link) => {
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
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}

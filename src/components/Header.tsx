'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ROUTES } from '@/lib/routes';

const primary = [ROUTES.quote, ROUTES.pairs, ROUTES.stats, ROUTES.status, ROUTES.docs, ROUTES.about];
const operator = [ROUTES.admin, ROUTES.events, ROUTES.webhooks, ROUTES.apiKeys, ROUTES.settings];

const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-400 text-sm font-bold text-white shadow-sm"
      >
        SR
      </span>
      <span className="text-lg font-semibold tracking-tight">StableRoute</span>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setConsoleOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!consoleOpen) return;
    const onClick = (e: MouseEvent) => {
      if (consoleRef.current && !consoleRef.current.contains(e.target as Node)) {
        setConsoleOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConsoleOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [consoleOpen]);

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${focusRing} ${
      pathname === href
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
        : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
    }`;

  const consoleActive = operator.some((r) => r.href === pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur dark:border-neutral-800/80 dark:bg-neutral-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className={`rounded-md ${focusRing}`} aria-label="StableRoute home">
          <Logo />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {primary.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              aria-current={pathname === r.href ? 'page' : undefined}
              className={linkClass(r.href)}
            >
              {r.title}
            </Link>
          ))}
          <div className="relative" ref={consoleRef}>
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={consoleOpen}
              aria-controls="console-menu"
              onClick={() => setConsoleOpen((o) => !o)}
              className={`${linkClass(consoleActive ? pathname : '__none')} inline-flex items-center gap-1`}
            >
              Console
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
              </svg>
            </button>
            {consoleOpen && (
              <div
                id="console-menu"
                className="absolute right-0 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
              >
                {operator.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    aria-current={pathname === r.href ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 ${focusRing}`}
                  >
                    <span className="block text-sm font-medium">{r.title}</span>
                    <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                      {r.description}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link
            href="/quote"
            className={`hidden rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 md:inline-block ${focusRing}`}
          >
            Get a quote
          </Link>
          <button
            type="button"
            className={`rounded-md border border-neutral-300 px-3 py-1.5 text-sm lg:hidden dark:border-neutral-700 ${focusRing}`}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          className="border-t border-neutral-200 px-4 pb-4 pt-2 lg:hidden dark:border-neutral-800"
        >
          <ul className="grid gap-1">
            {primary.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className={`block ${linkClass(r.href)}`}>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Console
          </p>
          <ul className="mt-1 grid gap-1">
            {operator.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className={`block ${linkClass(r.href)}`}>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 px-3 sm:hidden">
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}

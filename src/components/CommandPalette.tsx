"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  const matches = Object.values(ROUTES).filter((route) =>
    route.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          aria-label="Search routes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <ul className="mt-2 max-h-64 overflow-auto">
          {matches.map((route) => (
            <li key={route.href}>
              <button
                type="button"
                className="w-full rounded px-2 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => {
                  setOpen(false);
                  router.push(route.href);
                }}
              >
                {route.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

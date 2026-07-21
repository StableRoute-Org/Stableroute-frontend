"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getRoutesByGroup } from "@/lib/routes";

const routeGroups = getRoutesByGroup();

/**
 * Registers a global keydown listener that opens/closes the command palette
 * on ⌘/Ctrl+K and closes it on Escape. Does not interfere with native
 * browser shortcuts when the palette is closed.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const matchGroups = routeGroups
    .map(({ group, routes }) => ({
      group,
      routes: routes.filter((route) =>
        route.title.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter(({ routes }) => routes.length > 0);

  // Flattened in group/declaration order so arrow-key navigation moves
  // through one continuous sequence even though options render nested
  // under group headings.
  const matches = matchGroups.flatMap(({ routes }) => routes);

  const activeOptionId =
    activeIndex >= 0 && activeIndex < matches.length
      ? `command-palette-option-${matches[activeIndex].href}`
      : undefined;

  // Open/close via keyboard shortcut
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery("");
        setActiveIndex(-1);
      }
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus the input whenever the palette opens.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  // Keep the active option scrolled into view as it changes.
  useEffect(() => {
    if (!open || matches.length === 0) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>("[role=option]");
    items?.[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, matches.length, activeIndex]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => (prev < matches.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < matches.length) {
          const selectedRoute = matches[activeIndex];
          setOpen(false);
          setQuery("");
          setActiveIndex(-1);
          router.push(selectedRoute.href);
        }
        break;
    }
  };

  const handleOptionClick = (href: string) => {
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
    router.push(href);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8 pt-[20vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="command-palette-title" className="sr-only">
          Command palette
        </h2>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls="command-palette-listbox"
          aria-activedescendant={activeOptionId}
          aria-label="Search routes"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Jump to…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />
        <ul
          id="command-palette-listbox"
          role="listbox"
          ref={listRef}
          className="mt-2 max-h-64 overflow-auto"
        >
          {matches.length > 0 ? (
            matchGroups.map(({ group, routes }, groupIndex) => (
              <li
                key={group}
                className={
                  groupIndex > 0
                    ? "border-t border-neutral-200 dark:border-neutral-800"
                    : undefined
                }
              >
                <span
                  role="presentation"
                  className="block px-2 pt-2 text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                >
                  {group}
                </span>
                <ul>
                  {routes.map((route) => {
                    const index = matches.indexOf(route);
                    return (
                      <li key={route.href} role="presentation">
                        <button
                          id={`command-palette-option-${route.href}`}
                          role="option"
                          aria-selected={index === activeIndex}
                          type="button"
                          className={`w-full rounded px-2 py-2 text-left text-sm transition-colors ${
                            index === activeIndex
                              ? "bg-blue-500 text-white dark:bg-blue-600"
                              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          }`}
                          onClick={() => handleOptionClick(route.href)}
                          onMouseEnter={() => setActiveIndex(index)}
                        >
                          {route.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          ) : (
            <li className="px-2 py-2 text-sm text-neutral-500 dark:text-neutral-400">
              No routes found
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

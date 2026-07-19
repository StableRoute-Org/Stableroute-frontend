"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

const allRoutes = Object.values(ROUTES);

/**
 * Registers a global keydown listener that opens/closes the command palette
 * on ⌘/Ctrl+K and closes it on Escape. Does not interfere with native
 * browser shortcuts when the palette is closed.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const matches = allRoutes.filter((route) =>
    route.title.toLowerCase().includes(query.toLowerCase()),
  );

  const reset = useCallback(() => {
    setQuery("");
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const navigate = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  // Open/close via keyboard shortcut
  useEffect(() => {
    /**
     * Handles the global keydown for the command palette:
     * - ⌘/Ctrl+K opens the palette (saves current focus) or closes if already open.
     * - Escape closes the palette (only when open).
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!openRef.current) {
          previousFocusRef.current = document.activeElement as HTMLElement | null;
          setOpen(true);
        } else {
          close();
        }
        return;
      }

      if (event.key === "Escape" && openRef.current) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  // Move focus to input on open, restore on close
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation within the palette
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown": {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev >= matches.length - 1 ? 0 : prev + 1,
          );
          break;
        }
        case "ArrowUp": {
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev <= 0 ? matches.length - 1 : prev - 1,
          );
          break;
        }
        case "Enter": {
          event.preventDefault();
          if (matches.length > 0 && matches[selectedIndex]) {
            navigate(matches[selectedIndex].href);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, matches, selectedIndex, navigate]);

  // Scroll the selected item into view
  useEffect(() => {
    if (!open || matches.length === 0) return;
    const items = listRef.current?.querySelectorAll<HTMLElement>("[role=option]");
    items?.[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, matches.length, selectedIndex]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8 pt-[20vh]"
      onClick={close}
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
          aria-label="Search routes"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
          role="combobox"
          aria-expanded={matches.length > 0}
          aria-controls="command-palette-list"
          aria-activedescendant={
            matches.length > 0 ? `command-option-${selectedIndex}` : undefined
          }
        />

        {matches.length > 0 ? (
          <ul
            id="command-palette-list"
            ref={listRef}
            role="listbox"
            className="mt-2 max-h-64 overflow-auto"
            aria-label="Matching routes"
          >
            {matches.map((route, index) => (
              <li
                key={route.href}
                id={`command-option-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <button
                  type="button"
                  className={`w-full rounded px-3 py-2 text-left text-sm ${
                    index === selectedIndex
                      ? "bg-neutral-100 dark:bg-neutral-800"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  onClick={() => navigate(route.href)}
                  tabIndex={-1}
                >
                  <span className="font-medium">{route.title}</span>
                  {route.description && (
                    <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {route.description}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No matching routes found.
          </p>
        )}
      </div>
    </div>
  );
}

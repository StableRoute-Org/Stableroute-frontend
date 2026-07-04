"use client";

import { useEffect, useRef, useState } from "react";

export const shortcuts = [
  {
    keys: "?",
    label: "Open shortcuts help",
    description: "Show this reference from any StableRoute page.",
  },
  {
    keys: "Esc",
    label: "Close overlays",
    description: "Dismiss the shortcuts help and other modal-style surfaces.",
  },
  {
    keys: "Tab / Shift+Tab",
    label: "Move through navigation and controls",
    description: "Reach the header links, page actions, forms, and footer links.",
  },
  {
    keys: "Enter / Space",
    label: "Activate the focused control",
    description: "Open links, press buttons, and submit focused form actions.",
  },
  {
    keys: "Ctrl+R / Cmd+R",
    label: "Refresh route data",
    description: "Reload the current page to request fresh backend state.",
  },
];

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const wantsHelp = event.key === "?" || (event.key === "/" && event.shiftKey);
      if (wantsHelp) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
      aria-describedby="shortcuts-help-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="shortcuts-help-title" className="text-lg font-semibold">
              Keyboard shortcuts
            </h2>
            <p
              id="shortcuts-help-description"
              className="mt-1 text-sm text-neutral-600 dark:text-neutral-400"
            >
              StableRoute controls available from the keyboard.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close keyboard shortcuts"
            className="rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:hover:border-neutral-500"
          >
            Close
          </button>
        </div>

        <dl className="mt-5 divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="grid gap-2 py-4 sm:grid-cols-[9rem_1fr]"
            >
              <dt>
                <kbd className="inline-flex min-w-16 items-center justify-center rounded border border-neutral-300 bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100">
                  {shortcut.keys}
                </kbd>
              </dt>
              <dd>
                <p className="text-sm font-medium">{shortcut.label}</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {shortcut.description}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { readTheme, writeTheme, effectiveTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const t = readTheme();
    setTheme(t);
    document.documentElement.classList.toggle("dark", effectiveTheme(t) === "dark");
  }, []);

  const set = (next: Theme) => {
    setTheme(next);
    writeTheme(next);
    document.documentElement.classList.toggle("dark", effectiveTheme(next) === "dark");
  };

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-full border border-neutral-300 p-1 dark:border-neutral-700"
    >
      {(["light", "dark", "system"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => set(t)}
          aria-pressed={theme === t}
          className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] ${
            theme === t ? "bg-neutral-200 dark:bg-neutral-800" : ""
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

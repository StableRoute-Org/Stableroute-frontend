'use client';

import { useEffect } from 'react';
import { rawStringSerializer, useLocalStorage } from '@/lib/useLocalStorage';
import { effectiveTheme, isTheme, THEME_KEY, type Theme } from '@/lib/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    THEME_KEY,
    'system',
    isTheme,
    rawStringSerializer
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      effectiveTheme(theme) === 'dark'
    );
  }, [theme]);

  return (
    <div
      role="group"
      aria-label="Theme"
      className="inline-flex gap-1 rounded-full border border-neutral-300 p-1 dark:border-neutral-700"
    >
      {(['light', 'dark', 'system'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTheme(t)}
          aria-pressed={theme === t}
          className={`rounded-full px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] ${
            theme === t
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : ''
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

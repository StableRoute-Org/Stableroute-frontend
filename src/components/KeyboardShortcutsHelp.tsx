'use client';

import { useEffect, useState } from 'react';
import { ROUTES } from '@/lib/routes';

const SHORTCUTS = [
  { keys: '?', description: 'Open this shortcuts help' },
  { keys: 'Ctrl/⌘ K', description: 'Open command palette' },
  { keys: 'Esc', description: 'Close dialogs and overlays' },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.metaKey && !event.ctrlKey) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA')
          return;
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="shortcuts-title" className="text-lg font-semibold">
          Keyboard shortcuts
        </h2>
        <ul className="mt-4 space-y-2 text-sm">
          {SHORTCUTS.map((item) => (
            <li key={item.keys} className="flex justify-between gap-4">
              <span>{item.description}</span>
              <kbd className="rounded border px-2 py-0.5 font-mono text-xs">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-neutral-500">
          Jump routes:{' '}
          {Object.values(ROUTES)
            .map((route) => route.href)
            .join(', ')}
        </p>
      </div>
    </div>
  );
}

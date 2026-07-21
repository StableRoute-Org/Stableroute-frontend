'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

/**
 * Registers a global keydown listener that opens/closes the command palette
 * on ⌘/Ctrl+K and closes it on Escape. Does not interfere with native
 * browser shortcuts when the palette is closed.
 */
export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = Object.values(ROUTES).filter((route) =>
    route.title.toLowerCase().includes(query.toLowerCase())
  );

  const activeOptionId =
    activeIndex >= 0 && activeIndex < matches.length
      ? `command-palette-option-${matches[activeIndex].href}`
      : undefined;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
        setQuery('');
        setActiveIndex(-1);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setActiveIndex(-1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((prev) => (prev < matches.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (activeIndex >= 0 && activeIndex < matches.length) {
          const selectedRoute = matches[activeIndex];
          setOpen(false);
          setQuery('');
          setActiveIndex(-1);
          router.push(selectedRoute.href);
        }
        break;
    }
  };

  const handleOptionClick = (href: string) => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    router.push(href);
  };

  if (!open) return null;

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
          className="mt-2 max-h-64 overflow-auto"
        >
          {matches.length > 0 ? (
            matches.map((route, index) => (
              <li key={route.href} role="presentation">
                <button
                  id={`command-palette-option-${route.href}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  type="button"
                  className={`w-full rounded px-2 py-2 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? 'bg-blue-500 text-white dark:bg-blue-600'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  onClick={() => handleOptionClick(route.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {route.title}
                </button>
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

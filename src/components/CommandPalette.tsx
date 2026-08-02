'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { EmptyState } from './EmptyState';
import { Button } from './Button';

export type CommandPaletteProps = {
  /** Optional error message if route search encountered an error */
  error?: string | null;
  /** Callback fired when user clicks retry button in error state */
  onRetry?: () => void;
  /** Whether search operation is in progress */
  loading?: boolean;
};

/**
 * Registers a global keydown listener that opens/closes the command palette
 * on ⌘/Ctrl+K and closes it on Escape. Does not interfere with native
 * browser shortcuts when the palette is closed.
 */
export function CommandPalette({
  error = null,
  onRetry,
  loading = false,
}: CommandPaletteProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [announcement, setAnnouncement] = useState('');
  const [resultAnnouncement, setResultAnnouncement] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const matches = Object.values(ROUTES).filter((route) =>
    route.title.toLowerCase().includes(query.toLowerCase())
  );

  const activeOptionId =
    activeIndex >= 0 && activeIndex < matches.length
      ? `command-palette-option-${matches[activeIndex].href}`
      : undefined;

  const announce = useCallback((message: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setResultAnnouncement(message);
    }, 300);
  }, []);

  useEffect(() => {
    if (!query) return;
    if (matches.length > 0) {
      announce(
        `${matches.length} ${matches.length === 1 ? 'result' : 'results'} found`
      );
    } else {
      announce('No results found');
    }
  }, [matches.length, query, announce]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  // Update screen-reader live announcements on state changes.
  // Loading is reflected visually (and via a dedicated sr-only region below),
  // so we avoid announcing the exact same string twice.
  useEffect(() => {
    if (!open || loading) {
      setAnnouncement('');
      return;
    }

    if (error) {
      setAnnouncement(`Search failed: ${error}`);
    } else if (query.trim().length > 0 && matches.length === 0) {
      setAnnouncement(`No routes found for "${query.trim()}".`);
    } else if (matches.length > 0) {
      setAnnouncement(
        `Found ${matches.length} matching route${matches.length === 1 ? '' : 's'}.`
      );
    }
  }, [open, error, loading, query, matches.length]);

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

  const handleRetry = () => {
    setAnnouncement('Retrying route search…');
    if (onRetry) {
      onRetry();
    }
  };

  if (!open) return null;

  const isError = Boolean(error);
  const isEmpty = !isError && !loading && matches.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-8"
      onClick={() => setOpen(false)}
    >
      {/* Hidden ARIA live region for state announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Debounced, visually-hidden live region for rapid result updates */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {resultAnnouncement}
      </div>

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
          aria-invalid={isError}
          aria-describedby={
            isError ? 'command-palette-error-message' : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Jump to…"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-950"
        />

        {/* Loading State */}
        {loading && (
          <div className="mt-4 py-4 text-center text-sm text-neutral-500">
            Searching routes…
          </div>
        )}

        {/* Error State with Retry Affordance */}
        {isError && (
          <div
            id="command-palette-error-message"
            role="alert"
            aria-live="assertive"
            className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-center dark:border-rose-900/50 dark:bg-rose-950/30"
          >
            <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">
              Search failed
            </p>
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {error}
            </p>
            {onRetry && (
              <div className="mt-3">
                <Button type="button" variant="secondary" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Distinct Empty State */}
        {isEmpty && (
          <div className="mt-4">
            <EmptyState
              title="No routes found"
              description={
                query.trim().length > 0
                  ? `No routes match "${query}". Try searching for another keyword.`
                  : 'No routes available.'
              }
            />
          </div>
        )}

        {/* Results List */}
        {!loading && !isError && matches.length > 0 && (
          <ul
            id="command-palette-listbox"
            role="listbox"
            className="mt-2 max-h-64 overflow-auto"
          >
            {matches.map((route, index) => (
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
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


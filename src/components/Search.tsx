'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

export type SearchProps<T> = {
  /** Current search query string */
  query: string;
  /** Callback fired when search query changes */
  onQueryChange: (query: string) => void;
  /** Label for the search input (defaults to "Search") */
  inputLabel?: string;
  /** Placeholder text for input */
  placeholder?: string;
  /** Search results array. If null/undefined, indicates loading or uninitialized */
  results?: T[] | null;
  /** Render function for each item */
  renderItem?: (item: T, index: number) => ReactNode;
  /** Function to derive unique key for each item */
  getKey?: (item: T) => string;
  /** Whether search operation is in progress */
  loading?: boolean;
  /** Error message string if search failed */
  error?: string | null;
  /** Callback fired when user clicks retry button */
  onRetry?: () => void;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Custom error state title */
  errorTitle?: string;
  /** Extra class name for container */
  className?: string;
  /** List element ID for ARIA controls */
  listId?: string;
};

export function Search<T>({
  query,
  onQueryChange,
  inputLabel = 'Search',
  placeholder = 'Search…',
  results,
  renderItem,
  getKey,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No results found',
  emptyDescription,
  errorTitle = 'Search failed',
  className = '',
  listId = 'search-results-list',
}: SearchProps<T>) {
  const [announcement, setAnnouncement] = useState('');

  // Update live region announcements when state changes
  useEffect(() => {
    if (error) {
      setAnnouncement(`${errorTitle}: ${error}`);
    } else if (loading) {
      setAnnouncement('Searching…');
    } else if (results && query.trim().length > 0) {
      if (results.length === 0) {
        setAnnouncement(`No results found for "${query.trim()}".`);
      } else {
        const count = results.length;
        const suffix = count === 1 ? '' : 's';
        setAnnouncement(
          `Found ${count} result${suffix} for "${query.trim()}".`
        );
      }
    } else if (results && results.length === 0) {
      setAnnouncement(emptyTitle);
    } else {
      setAnnouncement('');
    }
  }, [error, errorTitle, loading, results, query, emptyTitle]);

  const handleRetry = () => {
    setAnnouncement('Retrying search…');
    if (onRetry) {
      onRetry();
    }
  };

  const hasQuery = query.trim().length > 0;
  const isError = Boolean(error);
  const isEmpty =
    !isError &&
    !loading &&
    results !== undefined &&
    results !== null &&
    results.length === 0;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Hidden ARIA live region for announcing search state changes */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="search-input" className="text-sm font-medium">
          {inputLabel}
        </label>
        <input
          id="search-input"
          type="search"
          role="combobox"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          aria-expanded={Boolean(results && results.length > 0)}
          aria-controls={listId}
          aria-invalid={isError}
          aria-describedby={isError ? 'search-error-message' : undefined}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-4 text-center text-sm text-neutral-500">
          Searching…
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div
          id="search-error-message"
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/30"
        >
          <p className="text-base font-semibold text-rose-800 dark:text-rose-200">
            {errorTitle}
          </p>
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
          {onRetry && (
            <div className="mt-4">
              <Button type="button" variant="secondary" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Distinct Empty state */}
      {isEmpty && (
        <EmptyState
          title={emptyTitle}
          description={
            emptyDescription ??
            (hasQuery
              ? `No items match "${query}". ` +
                'Try checking for typos or searching for another term.'
              : 'No items available.')
          }
        />
      )}

      {/* Success results list */}
      {!loading && !isError && results && results.length > 0 && renderItem && (
        <ul id={listId} role="listbox" className="flex flex-col gap-2">
          {results.map((item, index) => (
            <li
              key={getKey ? getKey(item) : index}
              role="option"
              aria-selected={false}
            >
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';

export interface SwapSearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  resultsCount?: number;
}

/**
 * Accessible swap search bar with live region updates, loading indicator,
 * clear action, and error state with retry.
 */
export function SwapSearchBar({
  query,
  onQueryChange,
  onClear,
  isLoading = false,
  isError = false,
  errorMessage = null,
  onRetry,
  label = 'Filter quotes',
  placeholder = 'Search by asset code',
  id = 'swap-search-input',
  className = '',
  resultsCount,
}: SwapSearchBarProps) {
  const [announcement, setAnnouncement] = useState('');

  // Update screen-reader live announcements as state changes
  useEffect(() => {
    if (isError && errorMessage) {
      setAnnouncement(`Search failed: ${errorMessage}`);
    } else if (isLoading) {
      setAnnouncement('Searching quotes…');
    } else if (query.trim()) {
      if (resultsCount !== undefined) {
        if (resultsCount === 0) {
          setAnnouncement(`No quotes match "${query.trim()}".`);
        } else {
          const suffix = resultsCount === 1 ? '' : 's';
          setAnnouncement(
            `Found ${resultsCount} quote${suffix} matching "${query.trim()}".`
          );
        }
      }
    } else {
      setAnnouncement('');
    }
  }, [isLoading, isError, errorMessage, query, resultsCount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && query) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Hidden polite live region for screen readers, rendered only when announcing */}
      {announcement ? (
        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <div className="relative flex items-center">
          <input
            id={id}
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-busy={isLoading}
            aria-invalid={isError}
            aria-describedby={isError ? `${id}-error` : undefined}
            className="w-full rounded-md border border-neutral-300 px-3 py-1.5 pr-16 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900" // stableroute-disable-line secret-scan
          />
          <div className="absolute right-2 flex items-center gap-1 text-xs">
            {isLoading && (
              <span
                data-testid="search-loading-indicator"
                className="text-neutral-500 dark:text-neutral-400"
              >
                Searching…
              </span>
            )}
            {query.length > 0 && !isLoading && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear search"
                className="rounded px-1.5 py-0.5 text-neutral-500 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-neutral-400 dark:hover:text-neutral-100" // stableroute-disable-line secret-scan
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Distinct Error state with Retry action */}
      {isError && (
        <div
          id={`${id}-error`}
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400" // stableroute-disable-line secret-scan
        >
          <span>{errorMessage ?? 'Search failed. Please try again.'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-2 font-medium underline hover:text-rose-900 dark:hover:text-rose-200"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { memo } from 'react';
import type { HistoryEntry, QuoteInputs } from './historyModel';

export type { HistoryEntry, QuoteInputs } from './historyModel';

export interface QuoteHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  /** True while the first row is an optimistic (unconfirmed) entry. */
  hasPendingEntry?: boolean;
}

const COLUMN_LABELS: Record<SortColumn, string> = {
  saved: 'Saved',
  source: 'Source',
  dest: 'Destination',
  amount: 'Amount',
};

function ariaSortValue(dir: SortDir): 'ascending' | 'descending' | 'none' {
  if (dir === 'asc') return 'ascending';
  if (dir === 'desc') return 'descending';
  return 'none';
}

/**
 * The swap-interface list as a real data table.
 *
 * Sorting (asc/desc/none), text and enum filtering, and pagination are all
 * encoded in the URL query string by `useTableViewState`, so any view is
 * shareable and fully restored on reload. Derived rows are computed through
 * one `useMemo` keyed on [history, view] so unrelated parent re-renders do
 * not recompute them.
 */
export const QuoteHistory = memo(function QuoteHistory({
  history,
  onSelect,
  hasPendingEntry = false,
}: QuoteHistoryProps) {
  const { view, update, filterInput, setFilterInput } = useTableViewState();

  const derived = React.useMemo(
    () => applyViewState(history, view),
    [history, view]
  );
  const sources = React.useMemo(() => distinctSources(history), [history]);

  return (
    <section
      aria-labelledby="recent-quotes-heading"
      className="flex flex-col gap-3"
    >
      <h2 id="recent-quotes-heading" className="text-sm font-medium">
        Recent quotes
      </h2>
      <ul className="flex flex-col gap-1">
        {history.map((entry, index) => {
          // The pending entry is always merged at index 0 (see
          // mergePendingEntry); render it dimmed with a non-visual hint.
          const isPending = hasPendingEntry && index === 0;
          return (
            <li
              key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
              data-pending={isPending || undefined}
            >
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={`w-full rounded border border-neutral-200 px-3 py-2 text-left text-sm hover:border-neutral-400 dark:border-neutral-800${
                  isPending ? ' opacity-60' : ''
                }`}
              >
                {entry.source} → {entry.dest} · {entry.amount}
                {isPending && (
                  <span className="sr-only"> (saving…)</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

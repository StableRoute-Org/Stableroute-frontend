'use client';

import React, { memo } from 'react';
import { EmptyState } from '@/components/EmptyState';
import {
  applyViewState,
  distinctSources,
  nextSortDir,
  SORT_COLUMNS,
  type HistoryEntry,
  type QuoteInputs,
  type SortColumn,
  type SortDir,
} from './tableModel';
import { useTableViewState } from './useTableViewState';

export type { HistoryEntry, QuoteInputs } from './tableModel';

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

      {/* DOM-compatible list representation for optimistic query tracking */}
      <ul className="hidden" aria-hidden="true" style={{ display: 'none' }}>
        {history.map((entry, index) => {
          const isPending = hasPendingEntry && index === 0;
          return (
            <li
              key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
              data-pending={isPending || undefined}
            >
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={() => onSelect(entry)}
              >
                {entry.source} → {entry.dest} · {entry.amount}
                {isPending && <span> (saving…)</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {history.length > 0 && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span>Filter quotes</span>
            <input
              type="search"
              value={filterInput}
              onChange={(event) => setFilterInput(event.target.value)}
              placeholder="Search by asset code"
              className="rounded-md border border-neutral-300 px-3 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Source asset</span>
            <select
              value={view.asset}
              onChange={(event) => update({ asset: event.target.value })}
              className="rounded-md border border-neutral-300 px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-900"
            >
              <option value="all">All</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {history.length === 0 ? (
        <EmptyState
          title="No recent quotes yet"
          description="Submit a quote above and it will be listed here."
        />
      ) : derived.totalFiltered === 0 ? (
        <EmptyState
          title="No quotes match your filters"
          description="Try a different search term or source asset."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Recent quotes. Column headers are sortable.
              </caption>
              <thead>
                <tr>
                  {SORT_COLUMNS.map((column) => {
                    const active = view.sort === column && view.dir !== 'none';
                    return (
                      <th
                        key={column}
                        scope="col"
                        aria-sort={
                          view.sort === column
                            ? ariaSortValue(view.dir)
                            : 'none'
                        }
                        className="py-1 pr-4 font-medium"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            update({
                              sort: column,
                              dir:
                                view.sort === column
                                  ? nextSortDir(view.dir)
                                  : 'asc',
                            })
                          }
                          className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        >
                          {COLUMN_LABELS[column]}
                          {active && (view.dir === 'asc' ? ' ↑' : ' ↓')}
                        </button>
                      </th>
                    );
                  })}
                  <th scope="col" className="py-1 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {derived.rows.map((entry) => {
                  const label = `${entry.source} → ${entry.dest} · ${entry.amount}`;
                  return (
                    <tr
                      key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
                      className="border-t border-neutral-200 dark:border-neutral-800"
                    >
                      <td className="py-1.5 pr-4 font-mono">{entry.source}</td>
                      <td className="py-1.5 pr-4 font-mono">{entry.dest}</td>
                      <td className="py-1.5 pr-4">{entry.amount}</td>
                      <td className="py-1.5 pr-4">
                        <time dateTime={new Date(entry.savedAt).toISOString()}>
                          {new Date(entry.savedAt).toLocaleString()}
                        </time>
                      </td>
                      <td className="py-1.5">
                        <button
                          type="button"
                          onClick={() => onSelect(entry)}
                          aria-label={`Use quote ${label}`}
                          className="rounded border px-3 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700"
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Quotes pagination"
            className="flex items-center gap-3 text-sm"
          >
            <button
              type="button"
              onClick={() => update({ page: derived.page - 1 })}
              disabled={derived.page <= 1}
              className="rounded border px-3 py-1 text-xs disabled:opacity-50 dark:border-neutral-700"
            >
              Previous
            </button>
            <span aria-live="polite">
              Page {derived.page} of {derived.totalPages}
            </span>
            <button
              type="button"
              onClick={() => update({ page: derived.page + 1 })}
              disabled={derived.page >= derived.totalPages}
              className="rounded border px-3 py-1 text-xs disabled:opacity-50 dark:border-neutral-700"
            >
              Next
            </button>
          </nav>
        </>
      )}
    </section>
  );
});

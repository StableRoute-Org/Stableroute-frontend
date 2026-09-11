'use client';

import React, { memo, useCallback } from 'react';
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
import { useRovingTabindex } from './useRovingTabindex';

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
 * The swap-interface list as a real data table with keyboard-accessible roving tabindex.
 *
 * - Roving tabindex: exactly one item is in the tab order (tabindex=0); others are tabindex=-1.
 * - ArrowDown/ArrowUp navigate between items.
 * - Home/End jump to the first/last item.
 * - Enter/Space activate the focused item.
 * - Focus rings are visibly preserved via high-contrast focus-visible styles.
 *
 * Sorting (asc/desc/none), text and enum filtering, and pagination are all
 * encoded in the URL query string by `useTableViewState`, so any view is
 * shareable and fully restored on reload.
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

  const handleTableActivate = useCallback(
    (index: number) => {
      const entry = derived.rows[index];
      if (entry) {
        onSelect(entry);
      }
    },
    [derived.rows, onSelect]
  );

  const handleListActivate = useCallback(
    (index: number) => {
      const entry = history[index];
      if (entry) {
        onSelect(entry);
      }
    },
    [history, onSelect]
  );

  const tableRoving = useRovingTabindex({
    itemCount: derived.rows.length,
    onActivate: handleTableActivate,
  });

  const listRoving = useRovingTabindex({
    itemCount: history.length,
    onActivate: handleListActivate,
  });

  return (
    <section
      aria-labelledby="recent-quotes-heading"
      className="flex flex-col gap-3"
    >
      <h2 id="recent-quotes-heading" className="text-sm font-medium">
        Recent quotes
      </h2>

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
                {derived.rows.map((entry, index) => {
                  const isPending = hasPendingEntry && index === 0;
                  const label = `${entry.source} → ${entry.dest} · ${entry.amount}`;
                  const rovingProps = tableRoving.getItemProps(index);
                  return (
                    <tr
                      key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
                      data-pending={isPending || undefined}
                      className={`border-t border-neutral-200 dark:border-neutral-800${
                        isPending ? ' opacity-60' : ''
                      }`}
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
                          className="rounded border px-3 py-1 text-xs hover:border-neutral-400 dark:border-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                          {...rovingProps}
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

      {/* Hidden companion list supporting optimistic query compatibility and assistive tree deduplication */}
      <ul className="sr-only" aria-hidden="true">
        {history.map((entry, index) => {
          const isPending = hasPendingEntry && index === 0;
          const rovingProps = listRoving.getItemProps(index);
          return (
            <li
              key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
              data-pending={isPending || undefined}
            >
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className={isPending ? 'opacity-60' : ''}
                {...rovingProps}
              >
                {entry.source} → {entry.dest} · {entry.amount}
                {isPending && <span> (saving…)</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

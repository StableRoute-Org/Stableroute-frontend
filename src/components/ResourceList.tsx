'use client';

import { useState, type ReactNode } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

/** Actions handed to `renderRow` so a row can trigger the shared remove flow. */
export type ResourceRowActions = {
  /** Open the shared remove-confirmation dialog for this row's item. */
  requestRemove: () => void;
};

export type ResourceListProps<T> = {
  /** The loaded items, or `null` while the first load is in flight. */
  items: T[] | null;
  /** Whether a (re)load is currently pending. */
  loading: boolean;
  /** Message shown when the list is empty (after loading finishes). */
  emptyMessage: string;
  /** Stable key for each item, used as the `<li>` React key. */
  getKey: (item: T) => string;
  /**
   * Render the inner content of a row. Receives the item and the shared
   * `requestRemove` action so the row's remove control can open the standard
   * confirmation dialog.
   *
   * Used in list mode (default). When `caption` is set and `renderCells` is
   * provided, this prop is ignored.
   */
  renderRow: (item: T, actions: ResourceRowActions) => ReactNode;
  /**
   * Render an array of `<td>` cells for a table row. Used together with
   * `caption` and `tableHeaders` to produce a semantic `<table>` instead of
   * the default `<ul>` list.
   */
  renderCells?: (item: T, actions: ResourceRowActions) => ReactNode[];
  /** Class string applied to every `<li>` or `<tr>`; defaults to the shared row layout. */
  rowClassName?: string;
  /** Title of the remove-confirmation dialog. */
  removeDialogTitle: string;
  /** Label of the remove-confirmation dialog's confirm button. */
  removeDialogConfirmLabel: string;
  /** Tone of the remove-confirmation dialog. Defaults to `danger`. */
  removeDialogTone?: 'default' | 'danger';
  /** Invoked with the item when removal is confirmed. */
  onRemove: (item: T) => void | Promise<void>;
  /** Loading message, defaults to `Loading…`. */
  loadingMessage?: string;
  /**
   * When provided, the list renders as a semantic `<table>` with this text
   * as the `<caption>`. The caption is visually hidden but available to
   * assistive technology.
   */
  caption?: string;
  /**
   * Column header labels for the table. Each entry produces a `<th>` with
   * `scope="col"` inside a `<thead>`. Required when `caption` is set.
   */
  tableHeaders?: string[];
};

/**
 * Shared list shell for the dashboard's CRUD pages (api-keys, webhooks, …).
 *
 * Encapsulates the polite live region, the loading / empty states, the
 * `divide-y` list markup, and the remove-confirmation dialog + state machine.
 * Page clients keep ownership of their create forms (which differ in fields
 * and pre-submit confirmation) and pass the per-row content via `renderRow`.
 *
 * When `caption` and `tableHeaders` are provided the component renders a
 * semantic `<table>` with `<caption>`, `scope="col"` headers, and
 * `scope="row"` on the first cell of each row — improving the experience
 * for screen-reader users.
 */
export function ResourceList<T>({
  items,
  loading,
  emptyMessage,
  getKey,
  renderRow,
  renderCells,
  rowClassName,
  removeDialogTitle,
  removeDialogConfirmLabel,
  removeDialogTone = 'danger',
  onRemove,
  loadingMessage = 'Loading…',
  caption,
  tableHeaders,
}: ResourceListProps<T>) {
  const [pendingRemove, setPendingRemove] = useState<T | null>(null);

  const confirmRemove = () => {
    const target = pendingRemove;
    setPendingRemove(null);
    void onRemove(target!);
  };

  const useTable = Boolean(caption && tableHeaders && renderCells);

  return (
    <>
      <div aria-live="polite" aria-atomic="true">
        {loading && !items && <p>{loadingMessage}</p>}
        {items && items.length === 0 && (
          <p className="text-sm text-neutral-600">{emptyMessage}</p>
        )}
        {items && items.length > 0 && useTable && (
          <table className="w-full border-collapse">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                {tableHeaders!.map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="border-b border-neutral-200 px-3 py-2 text-left text-sm font-medium dark:border-neutral-800"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={rowClassName}>
              {items.map((item) => (
                <tr key={getKey(item)}>
                  {renderCells!(item, {
                    requestRemove: () => setPendingRemove(item),
                  }).map((cell, i) =>
                    i === 0 ? (
                      <th
                        key={i}
                        scope="row"
                        className="border-b border-neutral-200 px-3 py-2 text-left text-sm font-medium dark:border-neutral-800"
                      >
                        {cell}
                      </th>
                    ) : (
                      <td
                        key={i}
                        className="border-b border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
                      >
                        {cell}
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {items && items.length > 0 && !useTable && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((item) => (
              <li
                key={getKey(item)}
                className={
                  rowClassName ??
                  'flex items-center justify-between gap-3 py-3'
                }
              >
                {renderRow(item, {
                  requestRemove: () => setPendingRemove(item),
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={pendingRemove !== null}
        tone={removeDialogTone}
        title={removeDialogTitle}
        confirmLabel={removeDialogConfirmLabel}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}

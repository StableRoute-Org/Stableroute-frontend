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
   */
  renderRow: (item: T, actions: ResourceRowActions) => ReactNode;
  /** Class string applied to every `<li>`; defaults to the shared row layout. */
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
};

/**
 * Shared list shell for the dashboard's CRUD pages (api-keys, webhooks, …).
 *
 * Encapsulates the polite live region, the loading / empty states, the
 * `divide-y` list markup, and the remove-confirmation dialog + state machine.
 * Page clients keep ownership of their create forms (which differ in fields
 * and pre-submit confirmation) and pass the per-row content via `renderRow`.
 */
export function ResourceList<T>({
  items,
  loading,
  emptyMessage,
  getKey,
  renderRow,
  rowClassName = 'flex items-center justify-between gap-3 py-3',
  removeDialogTitle,
  removeDialogConfirmLabel,
  removeDialogTone = 'danger',
  onRemove,
  loadingMessage = 'Loading…',
}: ResourceListProps<T>) {
  const [pendingRemove, setPendingRemove] = useState<T | null>(null);

  const confirmRemove = () => {
    const target = pendingRemove;
    setPendingRemove(null);
    void onRemove(target!);
  };

  return (
    <>
      <div aria-live="polite" aria-atomic="true">
        {loading && !items && <p>{loadingMessage}</p>}
        {items && items.length === 0 && (
          <p className="text-sm text-neutral-600">{emptyMessage}</p>
        )}
        {items && items.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((item) => (
              <li key={getKey(item)} className={rowClassName}>
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

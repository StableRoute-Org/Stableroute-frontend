'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type ColumnId,
  type ColumnVisibility,
  COLUMN_IDS,
  COLUMN_LABELS,
} from '@/lib/columnVisibility';

type Props = {
  visibility: ColumnVisibility;
  onToggle: (columnId: ColumnId) => void;
};

/**
 * Accessible dropdown menu that lets operators show / hide pairs-table
 * columns.
 *
 * - Uses a `<button>` + `<fieldset>` pattern (no external dependencies).
 * - Closes on outside click, Escape, or after a selection.
 * - Each checkbox is labelled with the column name; a disabled state on the
 *   last-checked box communicates the "at least one visible" constraint.
 */
export function ColumnVisibilityToggle({ visibility, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, close]);

  const visibleCount = COLUMN_IDS.filter(
    (id) => visibility[id] === true
  ).length;

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Columns (${visibleCount} of ${COLUMN_IDS.length} visible)`}
        onClick={() => setOpen((prev) => !prev)}
        className="rounded border px-3 py-1 text-xs dark:border-neutral-700"
      >
        Columns
      </button>
      {open && (
        <div
          ref={menuRef}
          role="group"
          aria-label="Toggle column visibility"
          className="absolute right-0 z-10 mt-1 w-48 rounded border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
        >
          <p className="mb-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
            Visible columns
          </p>
          <fieldset className="flex flex-col gap-1">
            <legend className="sr-only">Visible columns</legend>
            {COLUMN_IDS.map((id) => {
              const checked = visibility[id] === true;
              const isLastVisible = visibleCount === 1 && checked;
              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isLastVisible}
                    onChange={() => onToggle(id)}
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  {COLUMN_LABELS[id]}
                </label>
              );
            })}
          </fieldset>
        </div>
      )}
    </div>
  );
}

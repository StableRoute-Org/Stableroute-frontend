'use client';

import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  type ColumnId,
  type ColumnVisibility,
  COLUMN_IDS,
  DEFAULT_COLUMN_VISIBILITY,
  STORAGE_KEY,
  isColumnVisibility,
  resolveColumnVisibility,
} from './columnVisibility';

/**
 * React hook for managing pairs-table column visibility with localStorage
 * persistence.
 *
 * - SSR-safe: renders defaults on the server, syncs from storage after mount.
 * - Corrupt or invalid stored values silently fall back to defaults.
 * - The `toggle` callback enforces the "at least one column visible" invariant
 *   by refusing to hide the last visible column.
 */
export function useColumnVisibility() {
  const [stored, setStored] = useLocalStorage<ColumnVisibility>(
    STORAGE_KEY,
    DEFAULT_COLUMN_VISIBILITY,
    isColumnVisibility
  );

  // Resolve against defaults and enforce the at-least-one-visible invariant.
  const visibility: ColumnVisibility = useMemo(
    () => resolveColumnVisibility(stored),
    [stored]
  );

  const toggle = useCallback(
    (columnId: ColumnId) => {
      setStored((prev) => {
        const resolved = resolveColumnVisibility(prev);
        const currentVisible = COLUMN_IDS.filter(
          (id) => resolved[id] === true
        );

        // Refuse to hide the last visible column.
        if (resolved[columnId] === true && currentVisible.length === 1) {
          return resolved;
        }

        return { ...resolved, [columnId]: !resolved[columnId] };
      });
    },
    [setStored]
  );

  const isColumnVisible = useCallback(
    (columnId: ColumnId): boolean => visibility[columnId] === true,
    [visibility]
  );

  return { visibility, toggle, isColumnVisible } as const;
}

'use client';

/**
 * Pairs-table column visibility helpers.
 *
 * Provides types, validation, and a namespaced localStorage key for the
 * persisted operator preference. The `validate` function is intentionally
 * permissive about unknown keys so that future columns are silently ignored
 * rather than breaking the stored state.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Known column identifiers for the pairs table. */
export const COLUMN_IDS = ['source', 'destination', 'actions'] as const;
export type ColumnId = (typeof COLUMN_IDS)[number];

/** Map from column id to its user-facing label. */
export const COLUMN_LABELS: Record<ColumnId, string> = {
  source: 'Source',
  destination: 'Destination',
  actions: 'Actions',
};

/** A visibility map – keys are column ids, values are booleans. */
export type ColumnVisibility = Partial<Record<ColumnId, boolean>>;

// ---------------------------------------------------------------------------
// Defaults & persistence key
// ---------------------------------------------------------------------------

/** All columns visible by default. */
export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  source: true,
  destination: true,
  actions: true,
};

/** Namespaced localStorage key (SSR-safe via useLocalStorage). */
export const STORAGE_KEY = 'stableroute:pairs:columnVisibility';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Returns `true` when `value` is a non-null object whose enumerable keys
 * are all valid `ColumnId`s and whose values are all booleans.
 *
 * Unknown keys are rejected so that a corrupt store triggers a clean fallback
 * rather than silently propagating stale data.
 */
export function isColumnVisibility(value: unknown): value is ColumnVisibility {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  for (const [k, v] of Object.entries(value)) {
    if (!COLUMN_IDS.includes(k as ColumnId)) return false;
    if (typeof v !== 'boolean') return false;
  }
  return true;
}

/**
 * Resolve a stored (or freshly parsed) `ColumnVisibility` against the
 * canonical default.
 *
 * - Missing keys are filled from `DEFAULT_COLUMN_VISIBILITY`.
 * - Keys not present in `COLUMN_IDS` are stripped.
 * - If the result would leave *every* column hidden, the source column is
 *   forced visible so the table never becomes unusable.
 */
export function resolveColumnVisibility(
  stored: ColumnVisibility | null | undefined
): ColumnVisibility {
  const resolved: ColumnVisibility = { ...DEFAULT_COLUMN_VISIBILITY };

  if (stored && isColumnVisibility(stored)) {
    for (const id of COLUMN_IDS) {
      if (id in stored) {
        resolved[id] = stored[id];
      }
    }
  }

  // Guarantee at least one identifying column (source) is visible.
  const anyVisible = COLUMN_IDS.some((id) => resolved[id] === true);
  if (!anyVisible) {
    resolved.source = true;
  }

  return resolved;
}

# Pairs

`PairsClient` (`src/app/pairs/Client.tsx`) is the client-side view for managing
source→destination routing pairs. It fetches the pair list, displays them
grouped by source asset, and exposes filtering, column visibility, copy, and
delete actions.

## Props

`PairsClient` takes no props. It is the default export of `Client.tsx` and is
rendered by the RSC wrapper `src/app/pairs/page.tsx`.

## States

| State     | Description                                                                 |
|-----------|-----------------------------------------------------------------------------|
| **Loading** | A `<Spinner>` and "Loading…" text are shown inside the polite live region.  |
| **Error**   | An `role="alert"` paragraph with the error message is rendered above the list region. |
| **Empty (no pairs)** | `<EmptyState title="No pairs registered yet" …>` — the API returned an empty array. |
| **Empty (filter match)** | `<EmptyState title="No pairs found" …>` — pairs exist but the current filter excludes all of them. |
| **Success** | Pairs grouped by source asset under `<h2>` headings, with per-pair Quote / Details / Copy / Delete controls. |

States are mutually exclusive and live in a single `aria-live="polite"` region
so screen readers announce transitions automatically.

## Key behaviours

### Filtering
The search input (`placeholder="Search by asset code"`) filters pairs by
matching the query against both the source and destination fields. The
`filterPairs` helper in `pairsUtils.ts` implements the case-insensitive match.

### Grouping
`groupBySource` (also in `pairsUtils.ts`) groups matching pairs by source and
sorts both the source keys and their destination arrays alphabetically.

### Memoization
Both derivations are wrapped in `useMemo` keyed on `[pairs, query]`:

```tsx
const filtered = useMemo(() => (pairs ? filterPairs(pairs, query) : null), [pairs, query]);
const grouped  = useMemo(() => (filtered ? groupBySource(filtered) : []),   [filtered]);
```

Unrelated state changes — opening the delete dialog, a clipboard copy in
progress — do not trigger refiltering or regrouping.

### Copy pair symbol
Clicking **Copy** writes `"<source>/<destination>"` to the clipboard via
`writeToClipboard`. If the Clipboard API is unavailable or the write is denied,
a read-only `<textarea>` fallback is rendered inline so the user can select and
copy manually.

### Delete
Clicking **Delete** opens a `<ConfirmDialog>`. Confirming calls `apiDelete` and
then re-fetches the list.

### Column visibility
The **Columns** toggle menu (rendered by `<ColumnVisibilityToggle>`) lets users
show or hide the **Source**, **Destination**, and **Actions** columns. Preferences
are persisted to `localStorage` under the key exported from
`src/lib/columnVisibility.ts`. At least one column is always visible.

## Accessibility

- The loading/empty/success content lives inside a single `<section aria-live="polite" aria-busy={…}>`.
- Errors use `role="alert"` and are rendered outside the live region so they are announced immediately.
- Copy buttons carry `aria-label="Copy pair symbol <source>/<destination>"`.
- The fallback textarea is labelled `aria-label="Pair symbol <source>/<destination>"` and auto-selects on focus.

## Usage example

```tsx
// src/app/pairs/page.tsx (RSC wrapper — do not add 'use client' here)
import PairsClient from './Client';
export default function PairsPage() {
  return <PairsClient />;
}
```

## Related utilities

| File | Role |
|------|------|
| `src/app/pairs/pairsUtils.ts` | `filterPairs`, `groupBySource` |
| `src/app/pairs/PairsDrawer.tsx` | Detail drawer shown by the Details button |
| `src/lib/useApi.ts` | Data-fetching hook |
| `src/lib/clipboard.ts` | `writeToClipboard` with Clipboard API + fallback |
| `src/lib/columnVisibility.ts` | `useColumnVisibility`, `STORAGE_KEY` |

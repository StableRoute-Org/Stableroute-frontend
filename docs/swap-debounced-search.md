# Debounced Swap Interface Search with Request Cancellation

## Overview

The swap interface search provides debounced, race-free filtering of quote history entries with full request cancellation and accessibility features.

## Architecture

### 1. Pure Search Engine (`src/app/quote/searchQuotes.ts`)

- **Query Normalization**: Trims leading and trailing whitespace and converts to lower-case.
- **Field Matching**: Searches across source asset, destination asset, amount, and route representations (`USDC → EURC`).
- **Cancellation**: Accepts an optional `AbortSignal` and raises standard `AbortError` if aborted before or during search execution.
- **Structured Errors**: Throws `SearchExecutionError` with stable codes (e.g. `'SEARCH_NETWORK_ERROR'`, `'SEARCH_FAILED'`).

### 2. State Machine Hook (`src/app/quote/useDebouncedSwapSearch.ts`)

- **Debounce Timer**: Cancels pending timer on every keystroke and only dispatches the search after the inactivity pause (defaults to 250ms).
- **In-Flight Cancellation**: Aborts in-flight `AbortController` when a new query is initiated or when explicitly cancelled.
- **Monotonic Request Token Guard**: Tracks `latestTokenRef` to discard any out-of-order, stale responses (e.g. slow response finishing after a subsequent fast response).
- **Discrete States**:
  - `idle`: initial state or immediately when input is cleared.
  - `loading`: search request in-flight; sets `isLoading: true`.
  - `success`: results found; populates `results`.
  - `empty`: zero matches; sets `isEmpty: true` with empty results.
  - `error`: search rejected; captures structured `SearchExecutionError` and provides `retry()`.

### 3. Accessible Component (`src/app/quote/SwapSearchBar.tsx`)

- **ARIA Semantics**:
  - `aria-busy="true"` during search loading.
  - `aria-invalid="true"` and `aria-describedby` referencing the error alert when search fails.
  - Polite live region (`role="status"`, `aria-live="polite"`) announcing result counts and state changes.
- **Keyboard Shortcuts**: Escape key clears active search.
- **Clear Button**: Instant reset to full quote history without waiting for debounce timer.
- **Error State**: Renders an alert with retry button for keyboard and mouse users.

## Covered Edge Cases

1. **Typing quickly -> one query after the pause**: Consecutive keystrokes reset the debounce timer; only one query is dispatched after typing stops.
2. **Fast then slow response -> newest result wins**: Out-of-order responses from superseded requests are aborted via `AbortController` and dropped via `token < latestTokenRef.current`.
3. **No matches -> empty state**: Empty results trigger distinct empty state and screen-reader announcements.
4. **Cleared input -> resets results**: Clearing the query immediately resets results to the default list and aborts any active request.
5. **Error -> error state with retry**: Failures transition to an error state with an accessible retry action that re-dispatches the query.

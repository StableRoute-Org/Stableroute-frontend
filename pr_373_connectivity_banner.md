## Summary

Closes #373

Adds a connectivity-aware banner to the app shell that gives users a shared, dismissible signal when the StableRoute API is unreachable — replacing the current behavior where each page independently renders its own error text with no indication that the whole dashboard is offline.

## Motivation

When the backend behind `src/lib/config.ts` is down, every page independently renders its own error text with no shared signal that the whole dashboard is offline. This creates a fragmented user experience where:

- A user might see different error states across pages with no common context
- Page-specific error states don't distinguish between "this page's data failed" and "the entire API is unreachable"
- There's no browser-level awareness — if the user's device goes offline, the app silently fails

## What changed

### 1. `src/lib/apiClient.ts` — Connection event hooks

Added a `ConnectionHandler` mechanism that follows the existing `registerAuthErrorHandler` pattern:

- **New type**: `ConnectionHandler` with `onError` and `onSuccess` callbacks
- **New function**: `registerConnectionHandler(handler)` — registers a handler and returns an unregister function
- **Success path**: `onSuccess()` is called after every successful `parseResponse` (i.e., 2xx responses, including 204). The call is wrapped in a try-catch so callback exceptions never interfere with the request/response flow.
- **Error path**: `onError()` is called only when all retries are exhausted on a network-level failure (timeout or fetch failure). HTTP errors (4xx, 5xx) are explicitly excluded — the API is reachable in those cases, just returning errors.

### 2. `src/components/ConnectionBanner.tsx` — New component

A `"use client"` component mounted in the global shell that tracks connectivity from two sources:

| Signal | How it's detected | Behavior |
|--------|-------------------|----------|
| Browser offline | `navigator.onLine` on mount + `window` `offline` event listener | Shows banner immediately |
| API unreachable | `registerConnectionHandler` → `onError` callback | Shows banner after **2 consecutive** network failures |

**State machine:**

- **Hidden** → Banner is not rendered
- **Shown** (offline event or ≥2 consecutive failures): Renders an amber `role="alert"` banner with a dismiss button
- **Dismissed** → User clicks Dismiss; banner hides until the next error event
- **Cleared** → Any successful API request calls `onSuccess`, which resets the failure counter to 0 and hides the banner unconditionally

**Accessibility:**

- Uses `role="alert"` so screen readers announce it
- Dismiss button has `aria-label="Dismiss connectivity warning"`
- Uses the existing project focus-visible outline pattern

**Styling:**

- Amber palette: `bg-amber-50 text-amber-900 border-amber-200` (light) / `bg-amber-950 text-amber-200 border-amber-800` (dark)
- Max-width container matching the app's `max-w-5xl` layout
- Matches existing project design tokens and dark-mode conventions

### 3. `src/app/layout.tsx` — Shell integration

Placed `<ConnectionBanner />` above `<Header />` inside the `<ToastProvider>`, so it appears on every page without disrupting page-specific error or empty states.

### 4. `src/components/__tests__/ConnectionBanner.test.tsx` — 12 tests

Comprehensive test suite covering all states and transitions:

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | Does not render when online and no failures | Initial/default state |
| 2 | Renders immediately when `navigator.onLine` is false | Offline-on-mount detection |
| 3 | Shows after offline event fires | Browser offline → banner visibility |
| 4 | Shows after 2 consecutive API errors | Threshold-based triggering (1 failure = no banner) |
| 5 | Clears when a successful request fires after failures | `onSuccess` clears the banner |
| 6 | Resets the failure counter on success | Counter resets, requiring 2 new failures to re-trigger |
| 7 | User can dismiss the banner | Dismiss button hides the banner |
| 8 | Re-shows on a new error after user dismiss | Dismiss is temporary; new errors re-trigger |
| 9 | Stays hidden after dismiss without new errors | No false re-triggering |
| 10 | Clears on success even when shown due to offline state | `onSuccess` works regardless of visibility source |
| 11 | Unregisters connection handler on unmount | Cleanup prevents memory leaks |
| 12 | Removes offline event listener on unmount | Cleanup prevents memory leaks |

### 5. `ARCHITECTURE.md` — Documentation

Added a **Connectivity monitoring** section explaining the `ConnectionBanner` architecture, its placement in the shell, and its interaction with `apiClient`.

## Design decisions

1. **Two-failure threshold**: A single network failure could be a transient blip (e.g., WiFi reconnect). Requiring two consecutive failures before showing the banner avoids alert fatigue.

2. **HTTP errors excluded from "unreachable"**: A 500 or 400 response means the API *is* reachable — it's just returning an error. These are handled by page-level error states. Only true network failures (timeouts, DNS errors, connection refused) trigger the connectivity banner.

3. **`onSuccess` wrapped in try-catch**: The callback is invoked from inside the `apiFetch` try block. If the callback ever threw, it would be caught by the error handler and misclassified. Defensive try-catch prevents this.

4. **No "online" event listener**: Coming back online doesn't automatically clear the banner — the API could still be unreachable. Only a successful API call proves connectivity.

5. **Follows `registerAuthErrorHandler` pattern**: Consistency with existing codebase conventions was prioritized. The `ConnectionHandler` registration mirrors the existing `AuthErrorHandler` exactly.

## Testing

```
PASS src/components/__tests__/ConnectionBanner.test.tsx (12/12)
PASS src/lib/__tests__/apiClient.test.ts          (15/15, all pre-existing tests pass)
```

All pre-existing test failures (11 suites, 47 tests) are unrelated to these changes and exist on `main`:
- `events/page.test.tsx` — `Button is not defined` in events/Client.tsx
- `pairs/page.test.tsx` — text content/attribute mismatches
- `layout.test.tsx`, `Header.test.tsx`, `ThemeToggle.test.tsx` — missing mocks (`useRouter`, `window.matchMedia`)
- `StatTile.test.tsx`, `TextField.test.tsx` — tag name/query mismatches
- `nextConfigHeaders.test.ts` — Permissions-Policy value mismatch
- `admin/page.test.tsx` — assertion mismatch

```
npm test -- --no-coverage  → 30 suites passed, 11 failed (pre-existing)
npm run build              → Compiled successfully, lint fails on pre-existing Button issue
```

## Screenshots / manual verification

- [ ] Light mode: amber banner with "The API is unreachable. Check your connection or try again later." and a Dismiss button
- [ ] Dark mode: amber banner with appropriate dark theme colors
- [ ] Dismiss click hides the banner
- [ ] Banner appears after two consecutive `apiFetch` network failures
- [ ] Banner appears when browser goes offline
- [ ] Successful API call clears the banner and resets the failure counter
- [ ] Banner is positioned above the Header, visible on every page

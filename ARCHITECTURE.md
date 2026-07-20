# Architecture

## App Router layout

- `src/app/layout.tsx` — global shell: skip link, toast provider, header/footer.
- `src/app/*/Client.tsx` — interactive dashboard pages.
- `src/lib/apiClient.ts` — shared fetch wrapper with auth-error hook and optional retry/timeout.
- `src/lib/config.ts` — API base resolution and validation.
- `src/lib/useApi.ts` / `src/lib/useList.ts` — client data-loading helpers.

## Data flow

Dashboard pages call the StableRoute HTTP API via `apiClient`, render loading/error/empty states, and expose manual refresh or polling where needed (stats, events).

## Connectivity monitoring

`ConnectionBanner` is mounted in the global shell (`src/app/layout.tsx`) and monitors API reachability:

- Listens to browser `offline` events and checks `navigator.onLine` on mount.
- Registers a `ConnectionHandler` with `apiClient` to receive `onError` (network-level failures) and `onSuccess` callbacks.
- Shows a dismissible amber banner after two consecutive network failures or when the browser goes offline.
- Automatically clears the banner when a request succeeds, resetting the failure counter.
- The banner sits above `<Header />` so it is visible on every page without disrupting page-specific error states.

## Testing

Jest + Testing Library cover components, page semantics, and parsing helpers (`events.ts`, `format.ts`).

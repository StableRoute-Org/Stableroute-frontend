# Architecture

## App Router layout

- `src/app/layout.tsx` — global shell: skip link, toast provider, header/footer.
- `src/app/*/Client.tsx` — interactive dashboard pages.
- `src/lib/apiClient.ts` — shared fetch wrapper with auth-error hook and optional retry/timeout.
- `src/lib/config.ts` — API base resolution and validation.
- `src/lib/useApi.ts` / `src/lib/useList.ts` — client data-loading helpers.
- `src/lib/clipboard.ts` — secure-context/permission-guarded clipboard writes (see `docs/clipboard.md`).

## Error handling

Errors are contained at the narrowest boundary that can recover them:

- `src/app/error.tsx` — root boundary, the last resort for errors no
  segment handles.
- `src/app/quote/error.tsx`, `src/app/events/error.tsx` — segment-level
  boundaries. A crash inside `QuoteClient` or `EventsClient` (render or
  effect) is caught at the segment, so the root layout — skip link,
  header, navigation, footer — stays mounted. Both delegate to the shared
  `src/components/SegmentError.tsx` fallback, which logs the error digest,
  announces the message via `role="alert"`, and offers a "Try again"
  button wired to Next's `reset()` so recovery re-renders only the
  segment — no full page reload.

New dashboard segments that own nontrivial client state should follow the
same pattern: add an `error.tsx` that renders `SegmentError` with the
segment's name.

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

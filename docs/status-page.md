# Status Page

The `/status` route gives operators a single place to confirm API connectivity
before filing a bug.

## How it works

1. On mount, the page calls `apiGet('/api/v1/health', { timeoutMs: 5_000 })`
   through the standard `apiFetch` client in `src/lib/apiClient.ts`.
2. Elapsed time is measured with `performance.now()` — the difference between
   the call and the response gives the round-trip latency.
3. Results are displayed in a 2×2 grid:
   - **Status** — "Reachable" (green) or "Unreachable" (red)
   - **HTTP Status** — the numeric status code, or "—" on network/timeout errors
   - **Latency** — milliseconds, rounded to the nearest integer
   - **Last checked** — relative timestamp via the `<TimeAgo>` component
4. A **Probe again** button lets operators re-run the check at any time.

## Resolved API base

The displayed base URL comes from `getApiBase()` in `src/lib/config.ts`, which
reads `NEXT_PUBLIC_STABLEROUTE_API_BASE` or falls back to `http://localhost:3001`.

## Files

| File                           | Purpose                                               |
| ------------------------------ | ----------------------------------------------------- |
| `src/app/status/page.tsx`      | Server wrapper, exports metadata                      |
| `src/app/status/Client.tsx`    | Client component with probe logic                     |
| `src/app/status/page.test.tsx` | Integration tests                                     |
| `src/lib/routes.ts`            | Route registration (key `status`, group `Operations`) |

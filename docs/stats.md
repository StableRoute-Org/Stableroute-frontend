# Stats

`StatsClient` (`src/app/stats/Client.tsx`) is the client-side view for the
router metrics dashboard. It polls `/api/v1/stats` on a back-off schedule,
displays live pair-count and pause/live status tiles, and lets users export a
point-in-time snapshot as JSON or CSV.

## Props

`StatsClient` takes no props. It is the default export of `Client.tsx` and is
rendered by the RSC wrapper `src/app/stats/page.tsx`.

## States

| State     | Description                                                                     |
|-----------|---------------------------------------------------------------------------------|
| **Loading** | `<Spinner label="Loading stats" />` and "Loading…" text inside the live region. |
| **Error**   | A styled card with `role="alert"` shows the error message, a note that retry is automatic, and a manual **Retry** button. |
| **Empty** | `<EmptyState title="No stats available yet" …>` — API returned `totalPairs: 0`. |
| **Success** | A `<dl>` grid of `<StatTile>` tiles (Pairs count, Live/Paused status), a freshness timestamp, and Download JSON / Download CSV buttons. |

States are mutually exclusive within a single `aria-live="polite" aria-atomic="true"` section.

## Polling

Stats are refreshed automatically using `useBackoffInterval`:

- On success: next poll fires after `POLL_MS` (5 s default).
- On error: the delay doubles on each consecutive failure (10 s → 20 s → 40 s), capped at `MAX_POLL_MS` (60 s).
- A successful response resets the failure counter and restores the 5 s cadence.
- Unmounting the component cancels any pending poll timer.

### Injecting timers for tests

`useBackoffInterval` accepts optional `schedule` / `cancel` functions so tests
can drive timing without real timers:

```tsx
useBackoffInterval(status, refetch, {
  baseMs:   5_000,
  maxMs:   60_000,
  schedule: (cb, ms) => setTimeout(cb, ms),
  cancel:   clearTimeout,
});
```

## Freshness label

A `<LastUpdated>` sub-component re-renders every second to display how long ago
the last successful response was received (e.g. "just now", "12s ago"). The
`formatStatsAge(deltaMs)` helper is exported for unit testing.

## Export

See [`docs/stats-export.md`](./stats-export.md) for the full snapshot shape,
serialisation, and download implementation details.

## Accessibility

- Loading / empty / success live in a single `aria-live="polite" aria-atomic="true"` region.
- The error card wraps its content in `role="alert"` and is rendered **outside** the live region so it announces immediately.
- The **Retry** button in the error card is keyboard-operable (`<Button type="button">Retry</Button>`).
- The metrics panel is a `<section aria-labelledby="stats-metrics-heading">` with a visually-hidden `<h2>`.

## Exported symbols

All of these are exported from `src/app/stats/Client.tsx` and are unit-tested
in `page.test.tsx`.

| Symbol | Kind | Purpose |
|--------|------|---------|
| `useBackoffInterval` | hook | Schedules the next poll after each settled request |
| `formatStatsAge` | function | Formats a millisecond delta as a human-readable age string |
| `buildStatsSnapshot` | function | Converts live `Stats` data to a typed snapshot object |
| `statsSnapshotToJson` | function | Serialises a snapshot to pretty-printed JSON |
| `statsSnapshotToCsv` | function | Serialises a snapshot to CSV |
| `downloadStatsSnapshot` | function | Triggers a browser file download (JSON or CSV) |
| `BackoffIntervalOptions` | type | Options accepted by `useBackoffInterval` |
| `StatsSnapshot` | type | Snapshot shape |
| `StatsSnapshotMetric` | type | Per-metric shape within a snapshot |

## Usage example

```tsx
// src/app/stats/page.tsx (RSC wrapper)
import StatsClient from './Client';
export default function StatsPage() {
  return <StatsClient />;
}
```

## Related files

| File | Role |
|------|------|
| `src/lib/useApi.ts` | `useApi` hook used for the initial and manual refetch |
| `src/lib/format.ts` | `formatNumber`, `formatTimestamp` |
| `src/lib/validate.ts` | `isStats` — runtime response validator |
| `src/components/StatTile.tsx` | Metric tile rendered in the success state |

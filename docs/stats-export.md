# Stats snapshot export

The Stats page (`src/app/stats/Client.tsx`) can copy or download a
point-in-time snapshot of the router metrics shown in its `StatTile` grid.

## Snapshot shape

```ts
type StatsSnapshotMetric = {
  label: string;
  value: number; // raw numeric value
  display: string; // human-readable value, via src/lib/format.ts helpers
};

type StatsSnapshot = {
  capturedAt: string; // ISO 8601 timestamp
  metrics: StatsSnapshotMetric[];
};
```

`buildStatsSnapshot(data, capturedAt?)` builds this shape from the `Stats`
API payload (`{ totalPairs, paused }`). `capturedAt` defaults to
`new Date().toISOString()` but can be passed explicitly for deterministic
tests. Each metric carries both the raw numeric value and its formatted
display string:

| Metric | `value`                 | `display`                  |
| ------ | ----------------------- | -------------------------- |
| Pairs  | `totalPairs`            | `formatNumber(totalPairs)` |
| Status | `1` if paused, else `0` | `"Paused"` or `"Live"`     |

## Serialisation

Three pure, DOM-free functions turn a snapshot into text:

- `statsSnapshotToText(snapshot)` — a concise heading, one line per displayed
  metric, and the ISO 8601 capture timestamp.
- `statsSnapshotToJson(snapshot)` — `JSON.stringify(snapshot, null, 2)`.
- `statsSnapshotToCsv(snapshot)` — a `label,value,display,capturedAt` header
  followed by one row per metric. Fields containing a comma, quote, or
  newline (e.g. `formatNumber`'s thousands separators) are quoted and
  internal quotes doubled, per standard CSV escaping.

All three are exported from `src/app/stats/Client.tsx` and can be unit tested
without touching the DOM.

The plain-text form mirrors the values visible in the tiles. For example:

```text
StableRoute stats snapshot
Pairs: 1,234
Status: Live
Captured: 2026-07-23T05:30:00.000Z
```

## Copy

The **Copy stats snapshot** button passes the plain-text form to the shared
`writeToClipboard` helper. A successful write produces a notification. The
button is disabled while the write is pending so repeated clicks cannot start
duplicate clipboard operations.

If the Clipboard API is unavailable or permission is denied, an error
notification explains the failure and the page shows the exact snapshot in a
read-only text area. Focusing that field selects all of its contents so the
operator can copy it manually. This fallback also works when the current stats
contain zero pairs.

## Download

`downloadStatsSnapshot(data, format)` (`format` is `"json"` or `"csv"`)
builds the snapshot, serialises it, and triggers a browser download:

1. Wraps the serialised text in a `Blob` with the matching MIME type
   (`application/json` or `text/csv`).
2. Creates an object URL via `URL.createObjectURL`, clicks a temporary
   `<a download>` anchor, then removes the anchor.
3. Revokes the object URL in a `finally` block so the download always
   releases its blob URL, even if the click handler throws.

Filenames are `stats-snapshot-<capturedAt>.<ext>`, with `:` and `.`
characters in the timestamp replaced by `-` so they're safe across
filesystems.

## UI

Once stats load successfully, the Stats page renders **Copy stats snapshot**,
**Download JSON**, and **Download CSV** buttons next to the metric tiles.
They're hidden while loading or on error, since there's no snapshot to export
yet.

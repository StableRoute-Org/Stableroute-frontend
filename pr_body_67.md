## Summary

Wires the shared formatNumber and formatStroops helpers into the stats page display, replacing hand-rolled markup with the reusable StatTile component.

## Changes

### Stats Page (src/app/stats/page.tsx)

- Imported formatNumber from src/lib/format.ts for thousands-separator formatting
- Replaced inline dl/dt/dd markup with the shared StatTile component
- totalPairs now renders with locale thousands separators (e.g. 1,234,567)
- Status tile uses the same StatTile for consistent layout

### Tests (src/app/stats/page.test.tsx)

- Creates a new comprehensive test file for the stats page
- Asserts formatNumber produces thousands separators (1,234,567)
- Tests Live/Paused status rendering
- Tests error state with role="alert" assertion

Closes #67

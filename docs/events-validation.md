# Event Log Validation

The event log treats the `/api/v1/events` response as untrusted data before it
reaches React rendering.

`src/lib/events.ts` validates each record at the UI boundary:

- `id` and `type` must be strings.
- `ts` must be a finite number.
- `payload` must be an object.
- payload previews are stringified with circular-reference protection.
- oversized payload previews are truncated.
- at most 200 valid events are rendered, even if the API returns more.

Malformed records are dropped. When the rendered list is capped, the events page
shows a short note with the rendered count and total valid count.

## CSV Export

The event log includes an **Export CSV** button that downloads the currently
filtered rows as a `.csv` file. No additional network request is made — the CSV
is built directly from the in-memory filtered list.

### Columns

| Column    | Description                                          |
| --------- | ---------------------------------------------------- |
| `id`      | Event identifier string                              |
| `ts`      | Event timestamp as an ISO-8601 string                |
| `type`    | Event type string (e.g. `pair.registered`)           |
| `payload` | Full JSON payload (never truncated, RFC 4180 quoted) |

### Escaping

All cell values are escaped according to RFC 4180:

- Values containing a comma, double-quote, carriage return, or newline are
  wrapped in double-quotes.
- Embedded double-quote characters are doubled (`"` → `""`).

The relevant helpers exported from `src/lib/events.ts` are:

- **`escapeCsvCell(value: string): string`** — escapes a single CSV cell value.
- **`buildEventsCsv(events: DisplayEvent[]): string`** — converts a
  `DisplayEvent[]` array to a UTF-8 CSV string with the header row.
- **`downloadCsv(content: string, filename: string): void`** — creates a
  temporary `Blob` object URL, triggers a browser download, and revokes the URL
  after use to avoid memory leaks.

### Behaviour

- The button is **disabled** while events are loading or when the filtered list
  is empty (including when a type filter matches no rows).
- The button text is "Export CSV" — clear and concise for all users.
- The filename is `events-<ISO-timestamp>.csv` (colons and periods replaced with
  hyphens for cross-platform compatibility).
- The export always uses the **full** payload (`fullPayload`), not the truncated
  preview, so operators get complete data regardless of payload size.

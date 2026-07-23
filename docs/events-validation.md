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

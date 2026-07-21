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

## Boundary behaviour

The following boundaries are subtle enough that they are pinned by tests in
[`src/lib/__tests__/eventsBoundaries.test.ts`](../src/lib/__tests__/eventsBoundaries.test.ts).

### Payload preview truncation

`MAX_PAYLOAD_PREVIEW_LENGTH` (4000) is an **inclusive** limit measured against
the pretty-printed (2-space) JSON string:

| Serialised length | `payloadPreview` | `fullPayload` |
| ----------------- | ---------------- | ------------- |
| `< limit`         | untruncated      | identical to `payloadPreview` |
| `== limit`        | untruncated      | identical to `payloadPreview` |
| `> limit`         | first `limit` chars + `"\n… truncated"` | the complete, untruncated JSON |

`fullPayload` therefore only diverges from `payloadPreview` once the payload
crosses the limit. Below and at the limit the two strings are the same
reference-equal value, so a "show full" expander is only meaningful past the
threshold.

### Non-serialisable payloads

- **Circular references** are replaced inline with the marker `"[Circular]"`.
  The record is still rendered as a normal event — a cycle does not drop it.
- **Serialisation that throws** (for example a `BigInt` value or a `toJSON`
  getter that throws) yields the fallback string
  `UNSERIALIZABLE_PAYLOAD_FALLBACK` (`"[Unserializable payload]"`) for both
  `payloadPreview` and `fullPayload`, rather than throwing or dropping the row.
- **Serialisation that produces a non-string** (for example a `toJSON` that
  returns `undefined`) cannot be rendered, so the record is dropped and is not
  counted in `totalValid`.

### Render cap

`MAX_RENDERED_EVENTS` (200) caps the rendered list using a **strictly greater
than** comparison:

| Valid record count | `events.length` | `totalValid` | `capped` |
| ------------------ | --------------- | ------------ | -------- |
| `< max`            | all valid       | valid count  | `false`  |
| `== max`           | `max`           | `max`        | `false`  |
| `> max`            | `max` (sliced)  | valid count  | `true`   |

`totalValid` always counts the valid records **before** the cap is applied, and
never counts malformed records that were dropped during validation. This lets
the UI show an accurate "showing 200 of N" note when the list is capped.

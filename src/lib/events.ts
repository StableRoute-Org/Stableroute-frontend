export type { AppEvent, DisplayEvent } from '@/lib/types';
import type { AppEvent, DisplayEvent } from '@/lib/types';

export const MAX_RENDERED_EVENTS = 200;
export const MAX_PAYLOAD_PREVIEW_LENGTH = 4_000;

/**
 * Marker rendered in place of a payload that threw during serialisation (e.g. a
 * `BigInt` value or a throwing `toJSON`). The record is kept with this marker
 * rather than dropped, so the event still appears in the log.
 */
export const UNSERIALIZABLE_PAYLOAD_FALLBACK = '[Unserializable payload]';

type EventsResponse = {
  items: unknown[];
};

/**
 * Validates the event-log API response at the UI boundary and returns only
 * render-safe records. Malformed records are dropped instead of throwing.
 *
 * Each returned {@link DisplayEvent} carries a truncated `payloadPreview`
 * (safe for inline rendering) as well as a `fullPayload` (for clipboard copy
 * or the "show full" expander).
 */
/** Sentinel used when an event payload cannot be JSON-serialised. */

export function parseEventsResponse(raw: unknown): {
  events: DisplayEvent[];
  totalValid: number;
  capped: boolean;
} {
  if (!isEventsResponse(raw)) {
    return { events: [], totalValid: 0, capped: false };
  }

  const validEvents = raw.items.flatMap((item) => {
    const event = parseAppEvent(item);
    return event ? [event] : [];
  });
  const capped = validEvents.length > MAX_RENDERED_EVENTS;

  return {
    events: validEvents.slice(0, MAX_RENDERED_EVENTS),
    totalValid: validEvents.length,
    capped,
  };
}

function isEventsResponse(raw: unknown): raw is EventsResponse {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    Array.isArray((raw as { items?: unknown }).items)
  );
}

function parseAppEvent(raw: unknown): DisplayEvent | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const event = raw as Partial<AppEvent>;

  if (
    typeof event.id !== 'string' ||
    typeof event.ts !== 'number' ||
    !Number.isFinite(event.ts) ||
    typeof event.type !== 'string'
  ) {
    return null;
  }

  if (typeof event.payload !== 'object' || event.payload === null) {
    return null;
  }

  const result = safeStringifyPayload(event.payload);

  if (result === null) {
    return null;
  }

  return {
    id: event.id,
    ts: event.ts,
    type: event.type,
    payloadPreview: result.preview,
    fullPayload: result.full,
  };
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * Escapes a single cell value for RFC 4180 CSV:
 * - Wraps the value in double-quotes when it contains a comma, double-quote,
 *   or newline character.
 * - Doubles any embedded double-quote characters.
 */
export function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CSV_HEADER = 'id,ts,type,payload\n';

/**
 * Converts an array of {@link DisplayEvent} objects into a UTF-8 CSV string
 * with columns: `id`, `ts` (ISO-8601), `type`, `payload` (full JSON).
 *
 * Commas, double-quotes, and newlines inside cell values are escaped per
 * RFC 4180.
 */
export function buildEventsCsv(events: DisplayEvent[]): string {
  const rows = events.map((event) => {
    const id = escapeCsvCell(event.id);
    const ts = escapeCsvCell(new Date(event.ts).toISOString());
    const type = escapeCsvCell(event.type);
    const payload = escapeCsvCell(event.fullPayload);
    return `${id},${ts},${type},${payload}`;
  });
  return CSV_HEADER + rows.join('\n');
}

/**
 * Triggers a browser download of `content` as a `.csv` file named
 * `filename`. Uses a temporary Blob object URL that is revoked after the
 * click to avoid memory leaks.
 *
 * This function is intentionally a thin wrapper so callers can test
 * {@link buildEventsCsv} independently without touching the DOM.
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------

/**
 * Safely serialises an arbitrary payload value to pretty-printed JSON.
 *
 * - **Circular references** → replaced with the string `"[Circular]"`.
 * - **Oversized payloads** → the output is truncated at
 *   `MAX_PAYLOAD_PREVIEW_LENGTH` chars and appended with `"… truncated"`.
 * - **Serialisation throws** (e.g. `BigInt`, a throwing `toJSON`) → the record
 *   is kept with `UNSERIALIZABLE_PAYLOAD_FALLBACK` as its preview and full text.
 * - **Serialises to a non-string** (e.g. `toJSON` → `undefined`) → the function
 *   returns `null` so the caller drops the record.
 *
 * @returns An object with `preview` (possibly truncated) and `full` (complete)
 *          serialised strings, or `null` if the payload serialises to a
 *          non-string value.
 */
function safeStringifyPayload(payload: unknown): {
  preview: string;
  full: string;
} | null {
  const seen = new WeakSet<object>();

  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      },
      2
    );
  } catch {
    // The payload threw during serialisation. Keep the record but mark the
    // payload as unserialisable rather than dropping the event entirely.
    return {
      preview: UNSERIALIZABLE_PAYLOAD_FALLBACK,
      full: UNSERIALIZABLE_PAYLOAD_FALLBACK,
    };
  }

  if (typeof serialized !== 'string') {
    return null;
  }

  if (serialized.length <= MAX_PAYLOAD_PREVIEW_LENGTH) {
    return { preview: serialized, full: serialized };
  }

  return {
    preview: `${serialized.slice(0, MAX_PAYLOAD_PREVIEW_LENGTH)}\n… truncated`,
    full: serialized,
  };
}

export type AppEvent = {
  id: string;
  ts: number;
  type: string;
  payload: unknown;
};

export type DisplayEvent = {
  id: string;
  ts: number;
  type: string;
  /**
   * Truncated (at MAX_PAYLOAD_PREVIEW_LENGTH) JSON preview of the event
   * payload, safe to render inside a `<pre>`. Never throws during
   * serialisation — circular references are replaced with "[Circular]"
   * and unexpected errors return the fallback `"[Unserializable payload]"`.
   */
  payloadPreview: string;
  /**
   * The complete, safe-serialised JSON of the payload (never truncated).
   * Only populated when the payload exceeds MAX_PAYLOAD_PREVIEW_LENGTH;
   * otherwise `fullPayload` is the same string as `payloadPreview`.
   * Use this for clipboard copy or when the user opts to view the
   * full payload.
   */
  fullPayload: string;
};

export const MAX_RENDERED_EVENTS = 200;
export const MAX_PAYLOAD_PREVIEW_LENGTH = 4_000;

/**
 * Rendered in place of a payload whose serialisation throws unexpectedly
 * (e.g. a value JSON cannot represent, or a `toJSON`/getter that throws).
 * Circular references are handled separately and never reach this fallback.
 */
export const UNSERIALIZABLE_PAYLOAD_FALLBACK = "[Unserializable payload]";

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
    typeof raw === "object" &&
    raw !== null &&
    Array.isArray((raw as { items?: unknown }).items)
  );
}

function parseAppEvent(raw: unknown): DisplayEvent | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const event = raw as Partial<AppEvent>;

  if (
    typeof event.id !== "string" ||
    typeof event.ts !== "number" ||
    !Number.isFinite(event.ts) ||
    typeof event.type !== "string"
  ) {
    return null;
  }

  if (typeof event.payload !== "object" || event.payload === null) {
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

/**
 * Safely serialises an arbitrary payload value to pretty-printed JSON.
 *
 * - **Circular references** → replaced with the string `"[Circular]"`.
 * - **Oversized payloads** → the output is truncated at
 *   `MAX_PAYLOAD_PREVIEW_LENGTH` chars and appended with `"… truncated"`.
 * - **Unexpected errors** during serialisation → both `preview` and `full`
 *   fall back to {@link UNSERIALIZABLE_PAYLOAD_FALLBACK}.
 *
 * @returns An object with `preview` (possibly truncated) and `full` (complete)
 *          serialised strings, or `null` only when the payload serialises to a
 *          non-string (e.g. a `toJSON` that yields `undefined`).
 */
function safeStringifyPayload(payload: unknown): {
  preview: string;
  full: string;
} | null {
  const seen = new WeakSet<object>();

  try {
    const serialized = JSON.stringify(
      payload,
      (_key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      },
      2,
    );

    if (typeof serialized !== "string") {
      return null;
    }

    if (serialized.length <= MAX_PAYLOAD_PREVIEW_LENGTH) {
      return { preview: serialized, full: serialized };
    }

    return {
      preview: `${serialized.slice(0, MAX_PAYLOAD_PREVIEW_LENGTH)}\n… truncated`,
      full: serialized,
    };
  } catch {
    return {
      preview: UNSERIALIZABLE_PAYLOAD_FALLBACK,
      full: UNSERIALIZABLE_PAYLOAD_FALLBACK,
    };
  }
}

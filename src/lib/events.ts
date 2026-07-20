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
  payloadPreview: string;
};

export const MAX_RENDERED_EVENTS = 200;
export const MAX_PAYLOAD_PREVIEW_LENGTH = 4_000;

type EventsResponse = {
  items: unknown[];
};

/**
 * Validates the event-log API response at the UI boundary and returns only
 * render-safe records. Malformed records are dropped instead of throwing.
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

  const payloadPreview = safeStringifyPayload(event.payload);

  if (payloadPreview === null) {
    return null;
  }

  return {
    id: event.id,
    ts: event.ts,
    type: event.type,
    payloadPreview,
  };
}

function safeStringifyPayload(payload: unknown): string | null {
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
      return serialized;
    }

    return `${serialized.slice(0, MAX_PAYLOAD_PREVIEW_LENGTH)}\n… truncated`;
  } catch {
    return null;
  }
}

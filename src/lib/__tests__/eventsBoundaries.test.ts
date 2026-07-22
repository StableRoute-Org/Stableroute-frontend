import {
  MAX_PAYLOAD_PREVIEW_LENGTH,
  MAX_RENDERED_EVENTS,
  UNSERIALIZABLE_PAYLOAD_FALLBACK,
  parseEventsResponse,
} from '../events';

/**
 * Overhead (in characters) contributed by the object envelope when a
 * single-string-field payload is pretty-printed with 2-space indentation:
 *
 *   {
 *     "body": "<content>"
 *   }
 *
 * Measured against the exact serialiser the module uses so the boundary
 * fixtures stay correct even if the indent style ever changes.
 */
const ENVELOPE_OVERHEAD = JSON.stringify({ body: '' }, null, 2).length;

/**
 * Builds a payload whose pretty-printed serialisation is *exactly*
 * `targetLength` characters long. Asserts the invariant so a broken helper
 * can never silently weaken the boundary assertions that depend on it.
 */
function payloadSerializingTo(targetLength: number): { body: string } {
  const bodyLength = targetLength - ENVELOPE_OVERHEAD;
  const payload = { body: 'x'.repeat(bodyLength) };

  // Guard: the fixture is only meaningful if it truly lands on the boundary.
  expect(JSON.stringify(payload, null, 2)).toHaveLength(targetLength);

  return payload;
}

function wrap(payload: unknown) {
  return {
    items: [
      {
        id: 'evt-boundary',
        ts: 1_782_460_000_000,
        type: 'payload.boundary',
        payload,
      },
    ],
  };
}

describe('parseEventsResponse — payload preview truncation boundaries', () => {
  it('does not truncate a payload one character below the limit', () => {
    const payload = payloadSerializingTo(MAX_PAYLOAD_PREVIEW_LENGTH - 1);

    const { events } = parseEventsResponse(wrap(payload));
    const [event] = events;

    expect(event.payloadPreview).not.toContain('… truncated');
    expect(event.payloadPreview.length).toBe(MAX_PAYLOAD_PREVIEW_LENGTH - 1);
    // Below the threshold, preview and full are the identical string.
    expect(event.fullPayload).toBe(event.payloadPreview);
  });

  it('does not truncate a payload exactly at the limit (inclusive boundary)', () => {
    const payload = payloadSerializingTo(MAX_PAYLOAD_PREVIEW_LENGTH);

    const { events } = parseEventsResponse(wrap(payload));
    const [event] = events;

    // `serialized.length <= MAX_PAYLOAD_PREVIEW_LENGTH` — the limit is inclusive.
    expect(event.payloadPreview).not.toContain('… truncated');
    expect(event.payloadPreview.length).toBe(MAX_PAYLOAD_PREVIEW_LENGTH);
    expect(event.fullPayload).toBe(event.payloadPreview);
    expect(event.fullPayload.length).toBe(MAX_PAYLOAD_PREVIEW_LENGTH);
  });

  it('truncates a payload one character above the limit', () => {
    const payload = payloadSerializingTo(MAX_PAYLOAD_PREVIEW_LENGTH + 1);

    const { events } = parseEventsResponse(wrap(payload));
    const [event] = events;

    expect(event.payloadPreview).toContain('… truncated');
    // Preview keeps exactly MAX_PAYLOAD_PREVIEW_LENGTH source chars plus the
    // "\n… truncated" suffix; the full string is longer and diverges.
    expect(event.payloadPreview).toBe(
      `${event.fullPayload.slice(0, MAX_PAYLOAD_PREVIEW_LENGTH)}\n… truncated`
    );
    expect(event.fullPayload).not.toBe(event.payloadPreview);
    expect(event.fullPayload.length).toBe(MAX_PAYLOAD_PREVIEW_LENGTH + 1);
  });

  it('preserves the untruncated payload in fullPayload when the preview is truncated', () => {
    const payload = payloadSerializingTo(MAX_PAYLOAD_PREVIEW_LENGTH + 500);

    const { events } = parseEventsResponse(wrap(payload));
    const [event] = events;

    // fullPayload must round-trip back to the original payload object.
    expect(JSON.parse(event.fullPayload)).toEqual(payload);
    expect(event.fullPayload.length).toBe(MAX_PAYLOAD_PREVIEW_LENGTH + 500);
    expect(event.payloadPreview.startsWith('{')).toBe(true);
  });
});

describe('parseEventsResponse — non-serialisable payloads', () => {
  it('replaces circular references with the [Circular] marker instead of throwing', () => {
    const circular: Record<string, unknown> = { label: 'root' };
    circular.self = circular;

    const { events } = parseEventsResponse(wrap(circular));
    const [event] = events;

    expect(events).toHaveLength(1);
    expect(event.payloadPreview).toContain('[Circular]');
    // A circular payload is still a fully-rendered event, not the fallback.
    expect(event.payloadPreview).not.toBe(UNSERIALIZABLE_PAYLOAD_FALLBACK);
    expect(event.fullPayload).toContain('[Circular]');
  });

  it('marks nested circular references without dropping the record', () => {
    const inner: Record<string, unknown> = { name: 'inner' };
    const outer: Record<string, unknown> = { child: inner };
    inner.parent = outer;

    const { events } = parseEventsResponse(wrap(outer));

    expect(events).toHaveLength(1);
    expect(events[0].payloadPreview).toContain('[Circular]');
  });

  it('falls back to [Unserializable payload] when serialisation throws (BigInt)', () => {
    // JSON.stringify throws a TypeError on BigInt values.
    const { events } = parseEventsResponse(wrap({ amount: BigInt(10) }));
    const [event] = events;

    expect(events).toHaveLength(1);
    expect(event.payloadPreview).toBe(UNSERIALIZABLE_PAYLOAD_FALLBACK);
    expect(event.fullPayload).toBe(UNSERIALIZABLE_PAYLOAD_FALLBACK);
  });

  it('falls back to [Unserializable payload] when a toJSON getter throws', () => {
    const payload = {
      toJSON() {
        throw new Error('boom');
      },
    };

    const { events } = parseEventsResponse(wrap(payload));

    expect(events).toHaveLength(1);
    expect(events[0].payloadPreview).toBe(UNSERIALIZABLE_PAYLOAD_FALLBACK);
  });

  it('drops the record when the payload serialises to a non-string (toJSON → undefined)', () => {
    const payload = {
      toJSON() {
        return undefined;
      },
    };

    const result = parseEventsResponse(wrap(payload));

    // JSON.stringify yields `undefined` here (not a throw), so the record is
    // dropped rather than rendered with the fallback marker.
    expect(result.events).toHaveLength(0);
    expect(result.totalValid).toBe(0);
  });
});

describe('parseEventsResponse — render-cap boundaries', () => {
  function eventsOfCount(count: number) {
    return {
      items: Array.from({ length: count }, (_, index) => ({
        id: `evt-${index}`,
        ts: 1_782_460_000_000 + index,
        type: `event.${index}`,
        payload: { index },
      })),
    };
  }

  it('does not cap when valid count is one below the maximum', () => {
    const result = parseEventsResponse(eventsOfCount(MAX_RENDERED_EVENTS - 1));

    expect(result.events).toHaveLength(MAX_RENDERED_EVENTS - 1);
    expect(result.totalValid).toBe(MAX_RENDERED_EVENTS - 1);
    expect(result.capped).toBe(false);
  });

  it('does not cap when valid count is exactly the maximum (inclusive boundary)', () => {
    const result = parseEventsResponse(eventsOfCount(MAX_RENDERED_EVENTS));

    // `capped = validEvents.length > MAX_RENDERED_EVENTS` — strictly greater.
    expect(result.events).toHaveLength(MAX_RENDERED_EVENTS);
    expect(result.totalValid).toBe(MAX_RENDERED_EVENTS);
    expect(result.capped).toBe(false);
  });

  it('caps and flips `capped` only once past the maximum', () => {
    const result = parseEventsResponse(eventsOfCount(MAX_RENDERED_EVENTS + 1));

    expect(result.events).toHaveLength(MAX_RENDERED_EVENTS);
    expect(result.totalValid).toBe(MAX_RENDERED_EVENTS + 1);
    expect(result.capped).toBe(true);
  });

  it('counts totalValid from valid records only, before applying the cap', () => {
    const valid = Array.from(
      { length: MAX_RENDERED_EVENTS + 5 },
      (_, index) => ({
        id: `evt-${index}`,
        ts: 1_782_460_000_000 + index,
        type: `event.${index}`,
        payload: { index },
      })
    );
    // Interleave malformed records that must never reach the valid tally.
    const malformed = [
      null,
      'nope',
      { id: 7, ts: 1, type: 'x', payload: {} }, // non-string id
      { id: 'a', ts: Number.NaN, type: 'x', payload: {} }, // non-finite ts
      { id: 'b', ts: 1, type: 'x', payload: null }, // null payload
    ];

    const result = parseEventsResponse({ items: [...malformed, ...valid] });

    // totalValid reflects the valid records only — malformed ones are dropped
    // and never counted, even though they precede the cap.
    expect(result.totalValid).toBe(MAX_RENDERED_EVENTS + 5);
    expect(result.events).toHaveLength(MAX_RENDERED_EVENTS);
    expect(result.capped).toBe(true);
    // The rendered slice preserves the first MAX_RENDERED_EVENTS valid records.
    expect(result.events[0].id).toBe('evt-0');
    expect(result.events[MAX_RENDERED_EVENTS - 1].id).toBe(
      `evt-${MAX_RENDERED_EVENTS - 1}`
    );
  });

  it('reports capped=false with a full render when every record is valid but under the cap', () => {
    const result = parseEventsResponse(eventsOfCount(1));

    expect(result.events).toHaveLength(1);
    expect(result.totalValid).toBe(1);
    expect(result.capped).toBe(false);
  });
});

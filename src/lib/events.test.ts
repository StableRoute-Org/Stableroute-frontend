import {
  MAX_PAYLOAD_PREVIEW_LENGTH,
  MAX_RENDERED_EVENTS,
  parseEventsResponse,
} from "./events";

describe("parseEventsResponse", () => {
  it("returns an empty safe result for malformed response shapes", () => {
    expect(parseEventsResponse(null)).toEqual({
      events: [],
      totalValid: 0,
      capped: false,
    });
    expect(parseEventsResponse({ items: "not-an-array" })).toEqual({
      events: [],
      totalValid: 0,
      capped: false,
    });
  });

  it("renders circular payloads with a safe marker", () => {
    const circularPayload: Record<string, unknown> = { label: "root" };
    circularPayload.self = circularPayload;

    const result = parseEventsResponse({
      items: [
        {
          id: "evt-circular",
          ts: 1_782_460_000_000,
          type: "payload.circular",
          payload: circularPayload,
        },
      ],
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].payloadPreview).toContain("[Circular]");
  });

  it("truncates oversized payload previews", () => {
    const result = parseEventsResponse({
      items: [
        {
          id: "evt-large",
          ts: 1_782_460_000_000,
          type: "payload.large",
          payload: { body: "x".repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100) },
        },
      ],
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].payloadPreview.length).toBeLessThan(
      MAX_PAYLOAD_PREVIEW_LENGTH + 50,
    );
    expect(result.events[0].payloadPreview).toContain("truncated");
  });

  it("caps valid event rows defensively", () => {
    const result = parseEventsResponse({
      items: Array.from({ length: MAX_RENDERED_EVENTS + 1 }, (_, index) => ({
        id: `evt${index}`,
        ts: 1_782_460_000_000 + index,
        type: `event.${index}`,
        payload: { index },
      })),
    });

    expect(result.events).toHaveLength(MAX_RENDERED_EVENTS);
    expect(result.totalValid).toBe(MAX_RENDERED_EVENTS + 1);
    expect(result.capped).toBe(true);
  });
});

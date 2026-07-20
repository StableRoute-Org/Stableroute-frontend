import { WEBHOOK_EVENT_OPTIONS, isWebhookEventType } from "../webhookEvents";
import type { WebhookEventType } from "../webhookEvents";

describe("webhook events catalogue", () => {
  it("matches the documented set of webhook event identifiers", () => {
    const expected = [
      "pair.registered",
      "pair.deleted",
      "quote.requested",
      "router.paused",
      "router.unpaused",
    ] as const;

    expect(WEBHOOK_EVENT_OPTIONS).toEqual(expected);
    expect(WEBHOOK_EVENT_OPTIONS).toHaveLength(5);
  });

  it("has no duplicate event identifiers", () => {
    const unique = new Set(WEBHOOK_EVENT_OPTIONS);
    expect(unique.size).toBe(WEBHOOK_EVENT_OPTIONS.length);
  });

  it("has event identifiers using the dot-separated namespace convention", () => {
    for (const event of WEBHOOK_EVENT_OPTIONS) {
      expect(event).toMatch(/^[a-z]+\.[a-z]+$/);
    }
  });

  it("is a tuple with exactly 5 elements (no extra or missing events)", () => {
    expect(WEBHOOK_EVENT_OPTIONS.length).toBe(5);
    // Verify each position holds the expected value
    expect(WEBHOOK_EVENT_OPTIONS[0]).toBe("pair.registered");
    expect(WEBHOOK_EVENT_OPTIONS[1]).toBe("pair.deleted");
    expect(WEBHOOK_EVENT_OPTIONS[2]).toBe("quote.requested");
    expect(WEBHOOK_EVENT_OPTIONS[3]).toBe("router.paused");
    expect(WEBHOOK_EVENT_OPTIONS[4]).toBe("router.unpaused");
  });

  describe("isWebhookEventType guard", () => {
    it("returns true for every documented event", () => {
      for (const event of WEBHOOK_EVENT_OPTIONS) {
        expect(isWebhookEventType(event)).toBe(true);
      }
    });

    it("returns false for undocumented events", () => {
      expect(isWebhookEventType("pair.created")).toBe(false);
      expect(isWebhookEventType("router.started")).toBe(false);
      expect(isWebhookEventType("")).toBe(false);
      expect(isWebhookEventType("quote.requested ")).toBe(false);
    });

    it("returns false for completely unrelated strings", () => {
      expect(isWebhookEventType("hello")).toBe(false);
      expect(isWebhookEventType("123")).toBe(false);
    });

    it("narrows the type when true", () => {
      const value: string = "pair.registered";
      if (isWebhookEventType(value)) {
        // TypeScript narrowing: value is now WebhookEventType
        const typed: WebhookEventType = value;
        expect(typed).toBe("pair.registered");
      }
    });
  });
});

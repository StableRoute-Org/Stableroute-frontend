/** Documented webhook event types accepted by the router. */
export const WEBHOOK_EVENT_OPTIONS = [
  'pair.registered',
  'pair.deleted',
  'quote.requested',
  'router.paused',
  'router.unpaused',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_OPTIONS)[number];

export function isWebhookEventType(value: string): value is WebhookEventType {
  return (WEBHOOK_EVENT_OPTIONS as readonly string[]).includes(value);
}

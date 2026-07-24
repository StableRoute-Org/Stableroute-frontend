import type {
  Pair,
  Quote,
  ApiKey,
  CreateApiKeyResponse,
  Webhook,
} from '@/lib/types';
import { isWebhookEventType } from '@/lib/webhookEvents';

// ---------------------------------------------------------------------------
// Structural metadata (never leaks values)
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable type description for `v` without ever exposing
 * the value itself. Used exclusively in {@link ValidationError} construction
 * so that sensitive fields (e.g. API key secrets) can never accidentally
 * leak through error metadata.
 */
export function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

// ---------------------------------------------------------------------------
// ValidationError
// ---------------------------------------------------------------------------

/**
 * Thrown when an API response fails runtime validation.
 *
 * Carries only structural metadata — which field was wrong, what type was
 * expected, and what type was actually received (always via {@link describeType},
 * never a stringified value). This prevents sensitive data (API keys, secrets)
 * from leaking into error logs, Sentry, or error boundaries.
 */
export class ValidationError extends Error {
  readonly code = 'VALIDATION_ERROR' as const;

  constructor(
    message: string,
    /** Dot-path to the failing field, e.g. `"root"`, `"events[2].type"`. */
    public readonly field: string,
    /** Expected type name, e.g. `"string"`, `"boolean"`. */
    public readonly expected: string,
    /** Actual type name via {@link describeType}, never the raw value. */
    public readonly received: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isBoolean(v: unknown): v is boolean {
  return typeof v === 'boolean';
}

// ---------------------------------------------------------------------------
// Pair
// ---------------------------------------------------------------------------

export function isPair(v: unknown): v is Pair {
  if (!isObject(v)) return false;
  if (typeof v.source !== 'string') return false;
  if (typeof v.destination !== 'string') return false;
  return true;
}

export function parsePair(v: unknown): Pair {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isString(v.source)) {
    throw new ValidationError(
      'Expected string',
      'source',
      'string',
      describeType(v.source)
    );
  }
  if (!isString(v.destination)) {
    throw new ValidationError(
      'Expected string',
      'destination',
      'string',
      describeType(v.destination)
    );
  }
  return v as unknown as Pair;
}

// ---------------------------------------------------------------------------
// Quote
// ---------------------------------------------------------------------------

export function isQuote(v: unknown): v is Quote {
  if (!isObject(v)) return false;
  if (typeof v.source_asset !== 'string') return false;
  if (typeof v.dest_asset !== 'string') return false;
  if (typeof v.amount !== 'string') return false;
  if (typeof v.estimated_rate !== 'string') return false;
  if (!Array.isArray(v.route)) return false;
  if (!v.route.every((el) => typeof el === 'string')) return false;
  return true;
}

export function parseQuote(v: unknown): Quote {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isString(v.source_asset)) {
    throw new ValidationError(
      'Expected string',
      'source_asset',
      'string',
      describeType(v.source_asset)
    );
  }
  if (!isString(v.dest_asset)) {
    throw new ValidationError(
      'Expected string',
      'dest_asset',
      'string',
      describeType(v.dest_asset)
    );
  }
  if (!isString(v.amount)) {
    throw new ValidationError(
      'Expected string',
      'amount',
      'string',
      describeType(v.amount)
    );
  }
  if (!isString(v.estimated_rate)) {
    throw new ValidationError(
      'Expected string',
      'estimated_rate',
      'string',
      describeType(v.estimated_rate)
    );
  }
  if (!Array.isArray(v.route)) {
    throw new ValidationError(
      'Expected array',
      'route',
      'array',
      describeType(v.route)
    );
  }
  if (!v.route.every((el) => typeof el === 'string')) {
    throw new ValidationError(
      'Expected array of strings',
      'route',
      'string[]',
      'mixed[]'
    );
  }
  return v as unknown as Quote;
}

// ---------------------------------------------------------------------------
// ApiKey
// ---------------------------------------------------------------------------

export function isApiKey(v: unknown): v is ApiKey {
  if (!isObject(v)) return false;
  if (typeof v.prefix !== 'string') return false;
  if (typeof v.label !== 'string') return false;
  if (typeof v.createdAt !== 'number' || !Number.isFinite(v.createdAt))
    return false;
  return true;
}

export function parseApiKey(v: unknown): ApiKey {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isString(v.prefix)) {
    throw new ValidationError(
      'Expected string',
      'prefix',
      'string',
      describeType(v.prefix)
    );
  }
  if (!isString(v.label)) {
    throw new ValidationError(
      'Expected string',
      'label',
      'string',
      describeType(v.label)
    );
  }
  if (!isFiniteNumber(v.createdAt)) {
    throw new ValidationError(
      'Expected finite number',
      'createdAt',
      'number',
      describeType(v.createdAt)
    );
  }
  return v as unknown as ApiKey;
}

// ---------------------------------------------------------------------------
// CreateApiKeyResponse
// ---------------------------------------------------------------------------

export function isCreateApiKeyResponse(v: unknown): v is CreateApiKeyResponse {
  if (!isObject(v)) return false;
  if (typeof v.key !== 'string') return false;
  if (v.prefix !== undefined && typeof v.prefix !== 'string') return false;
  return true;
}

export function parseCreateApiKeyResponse(v: unknown): CreateApiKeyResponse {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isString(v.key)) {
    throw new ValidationError(
      'Expected string',
      'key',
      'string',
      describeType(v.key)
    );
  }
  if (v.prefix !== undefined && !isString(v.prefix)) {
    throw new ValidationError(
      'Expected string',
      'prefix',
      'string',
      describeType(v.prefix)
    );
  }
  return v as unknown as CreateApiKeyResponse;
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

export function isWebhook(v: unknown): v is Webhook {
  if (!isObject(v)) return false;
  if (typeof v.id !== 'string') return false;
  if (typeof v.url !== 'string') return false;
  if (!Array.isArray(v.events)) return false;
  if (!v.events.every((el) => typeof el === 'string' && isWebhookEventType(el)))
    return false;
  if (typeof v.createdAt !== 'number' || !Number.isFinite(v.createdAt))
    return false;
  return true;
}

export function parseWebhook(v: unknown): Webhook {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isString(v.id)) {
    throw new ValidationError(
      'Expected string',
      'id',
      'string',
      describeType(v.id)
    );
  }
  if (!isString(v.url)) {
    throw new ValidationError(
      'Expected string',
      'url',
      'string',
      describeType(v.url)
    );
  }
  if (!Array.isArray(v.events)) {
    throw new ValidationError(
      'Expected array',
      'events',
      'array',
      describeType(v.events)
    );
  }
  const invalidIndex = v.events.findIndex(
    (el) => typeof el !== 'string' || !isWebhookEventType(el)
  );
  if (invalidIndex !== -1) {
    throw new ValidationError(
      'Expected valid webhook event type',
      `events[${invalidIndex}]`,
      'webhook_event_type',
      describeType(v.events[invalidIndex])
    );
  }
  if (!isFiniteNumber(v.createdAt)) {
    throw new ValidationError(
      'Expected finite number',
      'createdAt',
      'number',
      describeType(v.createdAt)
    );
  }
  return v as unknown as Webhook;
}

// ---------------------------------------------------------------------------
// RouterStatus
// ---------------------------------------------------------------------------

type RouterStatus = { paused: boolean };

export function isRouterStatus(v: unknown): v is RouterStatus {
  if (!isObject(v)) return false;
  if (typeof v.paused !== 'boolean') return false;
  return true;
}

export function parseRouterStatus(v: unknown): RouterStatus {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isBoolean(v.paused)) {
    throw new ValidationError(
      'Expected boolean',
      'paused',
      'boolean',
      describeType(v.paused)
    );
  }
  return v as unknown as RouterStatus;
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

type Stats = { totalPairs: number; paused: boolean };

export function isStats(v: unknown): v is Stats {
  if (!isObject(v)) return false;
  if (typeof v.totalPairs !== 'number' || !Number.isFinite(v.totalPairs))
    return false;
  if (typeof v.paused !== 'boolean') return false;
  return true;
}

export function parseStats(v: unknown): Stats {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!isFiniteNumber(v.totalPairs)) {
    throw new ValidationError(
      'Expected finite number',
      'totalPairs',
      'number',
      describeType(v.totalPairs)
    );
  }
  if (!isBoolean(v.paused)) {
    throw new ValidationError(
      'Expected boolean',
      'paused',
      'boolean',
      describeType(v.paused)
    );
  }
  return v as unknown as Stats;
}

// ---------------------------------------------------------------------------
// Envelope validators
// ---------------------------------------------------------------------------

export function isPairsResponse(v: unknown): v is { pairs: Pair[] } {
  if (!isObject(v)) return false;
  if (!Array.isArray(v.pairs)) return false;
  if (!v.pairs.every((el) => isPair(el))) return false;
  return true;
}

export function parsePairsResponse(v: unknown): { pairs: Pair[] } {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!Array.isArray(v.pairs)) {
    throw new ValidationError(
      'Expected array',
      'pairs',
      'array',
      describeType(v.pairs)
    );
  }
  const invalidIndex = v.pairs.findIndex((el) => !isPair(el));
  if (invalidIndex !== -1) {
    throw new ValidationError(
      'Expected Pair',
      `pairs[${invalidIndex}]`,
      'Pair',
      describeType(v.pairs[invalidIndex])
    );
  }
  return v as unknown as { pairs: Pair[] };
}

export function isApiKeyListResponse(v: unknown): v is { items: ApiKey[] } {
  if (!isObject(v)) return false;
  if (!Array.isArray(v.items)) return false;
  if (!v.items.every((el) => isApiKey(el))) return false;
  return true;
}

export function parseApiKeyListResponse(v: unknown): { items: ApiKey[] } {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!Array.isArray(v.items)) {
    throw new ValidationError(
      'Expected array',
      'items',
      'array',
      describeType(v.items)
    );
  }
  const invalidIndex = v.items.findIndex((el) => !isApiKey(el));
  if (invalidIndex !== -1) {
    throw new ValidationError(
      'Expected ApiKey',
      `items[${invalidIndex}]`,
      'ApiKey',
      describeType(v.items[invalidIndex])
    );
  }
  return v as unknown as { items: ApiKey[] };
}

export function isWebhookListResponse(v: unknown): v is { items: Webhook[] } {
  if (!isObject(v)) return false;
  if (!Array.isArray(v.items)) return false;
  if (!v.items.every((el) => isWebhook(el))) return false;
  return true;
}

export function parseWebhookListResponse(v: unknown): { items: Webhook[] } {
  if (!isObject(v)) {
    throw new ValidationError(
      'Expected object',
      'root',
      'object',
      describeType(v)
    );
  }
  if (!Array.isArray(v.items)) {
    throw new ValidationError(
      'Expected array',
      'items',
      'array',
      describeType(v.items)
    );
  }
  const invalidIndex = v.items.findIndex((el) => !isWebhook(el));
  if (invalidIndex !== -1) {
    throw new ValidationError(
      'Expected Webhook',
      `items[${invalidIndex}]`,
      'Webhook',
      describeType(v.items[invalidIndex])
    );
  }
  return v as unknown as { items: Webhook[] };
}

/**
 * Centralized API response type definitions.
 *
 * This module consolidates all API response shapes used across the application
 * into a single source of truth, preventing type drift between pages and improving
 * maintainability. Validation logic remains in their respective modules
 * (e.g., quote.ts, events.ts).
 */

// ============================================================================
// Pairs
// ============================================================================

export type Pair = {
  source: string;
  destination: string;
};

// ============================================================================
// Quotes
// ============================================================================

export type Quote = {
  source_asset: string;
  dest_asset: string;
  amount: string;
  estimated_rate: string;
  route: string[];
};

// ============================================================================
// Events
// ============================================================================

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

// ============================================================================
// API Keys
// ============================================================================

export type ApiKey = {
  prefix: string;
  label: string;
  createdAt: number;
};

export type CreateApiKeyResponse = {
  key: string;
  prefix?: string;
};

// ============================================================================
// Webhooks
// ============================================================================

export type Webhook = {
  id: string;
  url: string;
  events: string[];
  createdAt: number;
};

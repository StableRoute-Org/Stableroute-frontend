import { getApiBase } from './config';
import { ValidationError, describeType } from './validate';

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

export type ApiFetchOptions = {
  /** Opt-in retry with exponential backoff for idempotent GET/HEAD requests. */
  retry?: {
    maxAttempts?: number;
    baseDelayMs?: number;
  };
  /** Request timeout in milliseconds. Default 15000. */
  timeoutMs?: number;
  /** Optional runtime type guard applied to the parsed JSON response. */
  validate?: (v: unknown) => v is unknown;
};

/** Header used to correlate frontend API calls with backend logs. */
export const REQUEST_ID_HEADER = 'X-Request-Id';

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/**
 * Reachability callbacks: `onError` fires on a network-level failure (the
 * request never got a response — offline, DNS, timeout), `onSuccess` fires
 * whenever a request does complete. HTTP error statuses (4xx/5xx) are not
 * connectivity failures, so they count as `onSuccess` for this purpose.
 */
type ConnectionHandler = { onError: () => void; onSuccess: () => void };
let _connectionHandler: ConnectionHandler | null = null;

const DEFAULT_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Creates a collision-resistant request id with no extra dependencies.
 * Prefers `crypto.randomUUID()`; falls back to a UUID v4 built from
 * `crypto.getRandomValues` (or `Math.random` as a last resort).
 */
export function createRequestId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  // RFC 4122 version 4 / variant 1
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
    ''
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Called once by <ApiAuthGuard> when it mounts inside <ToastProvider>. */
export function registerAuthErrorHandler(
  handler: AuthErrorHandler
): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/** Called once by <ConnectionBanner> when it mounts, to observe reachability. */
export function registerConnectionHandler(
  handler: ConnectionHandler
): () => void {
  _connectionHandler = handler;
  return () => {
    if (_connectionHandler === handler) _connectionHandler = null;
  };
}

/**
 * Removes sensitive data from an error message before it is displayed in a
 * toast or inline error.
 *
 * Two classes of sensitive data are redacted:
 *
 * 1. **Query strings** – any `?…` or `&…` segment that looks like a URL query
 *    parameter (key=value pairs) is stripped so asset codes, amounts, and other
 *    request inputs are not leaked into UI copy.
 *
 * 2. **Key-like tokens** – contiguous runs of 20+ hex or Base58 characters that
 *    resemble API keys, wallet addresses, or secrets are replaced with
 *    `[redacted]`. Prefixed key formats such as `sk_live_…`, `pk_test_…`, and
 *    `api_key_…` (two underscore-separated label segments followed by 16+ alphanumeric
 *    characters) are also redacted.
 *
 * The `requestId` field is preserved on the thrown error *object* (not in the
 * message string) so support can still correlate failures.
 */
export function sanitizeErrorMessage(message: string): string {
  // Strip query strings: remove everything from the first `?` through the end
  // of each key=value pair sequence, including `&`-separated continuations.
  // Matches patterns like: ?foo=bar&baz=qux  or  &baz=qux
  let sanitized = message.replace(/[?&][^?&\s#"']*=[^?&\s#"']*/g, '');

  // Redact tokens that look like API keys, secrets, or wallet addresses:
  // 20+ consecutive hex characters (0-9a-fA-F)
  sanitized = sanitized.replace(/\b[0-9a-fA-F]{20,}\b/g, '[redacted]');

  // 20+ consecutive Base58 characters (alphanumeric excluding 0, O, I, l)
  sanitized = sanitized.replace(/\b[1-9A-HJ-NP-Za-km-z]{20,}\b/g, '[redacted]');

  // Stellar / base32 addresses: 20+ consecutive uppercase letters and digits
  // (covers G-addresses and other uppercase-only opaque identifiers)
  sanitized = sanitized.replace(/\b[A-Z0-9]{20,}\b/g, '[redacted]');

  // Prefixed secret tokens: patterns like sk_live_<16+chars>, pk_test_<16+chars>,
  // api_key_<16+chars> — common formats for API keys, Stripe keys, and similar secrets
  sanitized = sanitized.replace(/\b\w+_\w+_[A-Za-z0-9]{16,}\b/g, '[redacted]');

  // Collapse any double-spaces left by the removals and trim
  return sanitized.replace(/\s{2,}/g, ' ').trim();
}

async function parseResponse<T>(
  res: Response,
  validate?: (v: unknown) => v is T,
  /** Client-generated id sent on the request; used when the body omits one. */
  clientRequestId?: string
): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let body: T | ApiError | undefined;
  if (text) {
    try {
      body = JSON.parse(text) as T | ApiError;
    } catch {
      if (!res.ok) {
        throw Object.assign(new Error(`HTTP ${res.status}`), {
          ...(clientRequestId !== undefined
            ? { requestId: clientRequestId }
            : {}),
        });
      }
      throw new Error('Invalid JSON response');
    }
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      _authErrorHandler?.(res.status as 401 | 403);
    }
    const rawMsg =
      (body as ApiError | undefined)?.message ?? `HTTP ${res.status}`;
    const safeMsg = sanitizeErrorMessage(rawMsg);
    // Build the error with the sanitized message. We deliberately exclude
    // body.message when spreading so the raw server text never overwrites
    // the redacted copy. Only status, error code, and requestId are kept.
    // Prefer the server's requestId when present; otherwise surface the
    // client-generated id that was sent on the request header.
    const apiBody = body as ApiError | undefined;
    const extra: Record<string, unknown> = { status: res.status };
    if (apiBody?.error !== undefined) extra.error = apiBody.error;
    const requestId = apiBody?.requestId ?? clientRequestId;
    if (requestId !== undefined) extra.requestId = requestId;
    throw Object.assign(new Error(safeMsg), extra);
  }
  if (validate && !validate(body)) {
    throw new ValidationError(
      'Response failed runtime validation',
      'root',
      'valid response shape',
      describeType(body)
    );
  }
  return body as T;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: ApiFetchOptions
): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';
  const maxAttempts =
    canRetry && options?.retry
      ? Math.max(1, options.retry.maxAttempts ?? 3)
      : 1;
  const baseDelayMs = options?.retry?.baseDelayMs ?? 100;
  // One id per logical call (shared across retries) for end-to-end tracing.
  const requestId = createRequestId();

  let lastError: unknown;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    // Honor caller aborts (e.g. quote page cancellation) while keeping timeout.
    const externalSignal = init.signal;
    let onExternalAbort: (() => void) | undefined;
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        onExternalAbort = () => controller.abort();
        externalSignal.addEventListener('abort', onExternalAbort);
      }
    }
    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
          [REQUEST_ID_HEADER]: requestId,
        },
        signal: controller.signal,
      });
      // A response of any status means the API is reachable.
      _connectionHandler?.onSuccess();
      if (!res.ok && res.status >= 500 && attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      // Reached the server (any HTTP status), so the network is up.
      _connectionHandler?.onSuccess();
      return await parseResponse<T>(
        res,
        options?.validate as ((v: unknown) => v is T) | undefined,
        requestId
      );
    } catch (err) {
      if (
        err instanceof Error &&
        ('status' in err ||
          err instanceof ValidationError ||
          err.message === 'Invalid JSON response' ||
          err.message.startsWith('HTTP '))
      ) {
        // An HTTP-level / parse error still means the request reached the server.
        _connectionHandler?.onSuccess();
        // Ensure support can correlate even when the body lacked requestId
        // (e.g. empty/non-JSON error responses that throw before assign).
        if (!('requestId' in err)) {
          Object.assign(err, { requestId });
        }
        throw err;
      }
      lastError = err;
      // Caller-initiated abort should not be reported as a timeout/network error.
      if (externalSignal?.aborted) {
        throw err;
      }
      const message =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Request timed out'
          : 'Network request failed';
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      _connectionHandler?.onError();
      throw Object.assign(new Error(message), { requestId });
    } finally {
      clearTimeout(timer);
      if (externalSignal && onExternalAbort) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }
  // Defensive: the loop always returns or throws on the final attempt.
  /* istanbul ignore next */
  throw Object.assign(lastError ?? new Error('request failed'), {
    requestId,
  });
}

export const apiGet = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, {}, options);
export const apiPost = <T>(
  path: string,
  body: unknown,
  options?: ApiFetchOptions
) => apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }, options);
export const apiPatch = <T>(
  path: string,
  body: unknown,
  options?: ApiFetchOptions
) =>
  apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, options);
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: 'DELETE' });

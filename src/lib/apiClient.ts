import { getApiBase } from "./config";

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
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/**
 * Notified about API connectivity: `onError` fires when a request fails at the
 * network layer (offline, DNS failure, timeout), and `onSuccess` fires whenever
 * the server responds at all (even with an HTTP error status) — a response
 * means the API is reachable. HTTP 4xx/5xx responses are *not* connectivity
 * failures and do not trigger `onError`.
 */
type ConnectionHandler = { onError: () => void; onSuccess: () => void };
let _connectionHandler: ConnectionHandler | null = null;

const DEFAULT_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Called once by <ApiAuthGuard> when it mounts inside <ToastProvider>. */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/** Called once by <ConnectionBanner> to observe API reachability. */
export function registerConnectionHandler(
  handler: ConnectionHandler,
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
  let sanitized = message.replace(/[?&][^?&\s#"']*=[^?&\s#"']*/g, "");

  // Redact tokens that look like API keys, secrets, or wallet addresses:
  // 20+ consecutive hex characters (0-9a-fA-F)
  sanitized = sanitized.replace(/\b[0-9a-fA-F]{20,}\b/g, "[redacted]");

  // 20+ consecutive Base58 characters (alphanumeric excluding 0, O, I, l)
  sanitized = sanitized.replace(/\b[1-9A-HJ-NP-Za-km-z]{20,}\b/g, "[redacted]");

  // Stellar / base32 addresses: 20+ consecutive uppercase letters and digits
  // (covers G-addresses and other uppercase-only opaque identifiers)
  sanitized = sanitized.replace(/\b[A-Z0-9]{20,}\b/g, "[redacted]");

  // Prefixed secret tokens: patterns like sk_live_<16+chars>, pk_test_<16+chars>,
  // api_key_<16+chars> — common formats for API keys, Stripe keys, and similar secrets
  sanitized = sanitized.replace(/\b\w+_\w+_[A-Za-z0-9]{16,}\b/g, "[redacted]");

  // Collapse any double-spaces left by the removals and trim
  return sanitized.replace(/\s{2,}/g, " ").trim();
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  let body: T | ApiError | undefined;
  if (text) {
    try {
      body = JSON.parse(text) as T | ApiError;
    } catch {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      throw new Error("Invalid JSON response");
    }
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      _authErrorHandler?.(res.status as 401 | 403);
    }
    const rawMsg = (body as ApiError | undefined)?.message ?? `HTTP ${res.status}`;
    const safeMsg = sanitizeErrorMessage(rawMsg);
    // Build the error with the sanitized message. We deliberately exclude
    // body.message when spreading so the raw server text never overwrites
    // the redacted copy. Only status, error code, and requestId are kept.
    const apiBody = body as ApiError | undefined;
    const extra: Record<string, unknown> = { status: res.status };
    if (apiBody?.error !== undefined) extra.error = apiBody.error;
    if (apiBody?.requestId !== undefined) extra.requestId = apiBody.requestId;
    throw Object.assign(new Error(safeMsg), extra);
  }
  return body as T;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: ApiFetchOptions,
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const canRetry = method === "GET" || method === "HEAD";
  const maxAttempts =
    canRetry && options?.retry ? Math.max(1, options.retry.maxAttempts ?? 3) : 1;
  const baseDelayMs = options?.retry?.baseDelayMs ?? 100;

  let lastError: unknown;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
        signal: controller.signal,
        ...init,
      });
      // A response of any status means the API is reachable.
      _connectionHandler?.onSuccess();
      if (!res.ok && res.status >= 500 && attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      return await parseResponse<T>(res);
    } catch (err) {
      if (
        err instanceof Error &&
        ("status" in err ||
          err.message === "Invalid JSON response" ||
          err.message.startsWith("HTTP "))
      ) {
        throw err;
      }
      lastError = err;
      const message =
        err instanceof DOMException && err.name === "AbortError"
          ? "Request timed out"
          : "Network request failed";
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      // Network-layer failure with no attempts left: the API is unreachable.
      _connectionHandler?.onError();
      throw new Error(message);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error("request failed");
}

export const apiGet = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, {}, options);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

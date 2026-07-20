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

const DEFAULT_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Called once by <ApiAuthGuard> when it mounts inside <ToastProvider>. */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/**
 * Parse the response body defensively.
 *
 * - Uses `res.text()` then `JSON.parse` so non-JSON or empty bodies never
 *   produce a raw `SyntaxError`.
 * - For a non-OK response with an unparseable body, synthesises an
 *   `ApiError`-shaped error with properties `error` and `status` derived
 *   from the HTTP status code.
 * - For `204`, returns `undefined` without reading the body.
 * - For an OK response with an unparseable body, throws with a clear message
 *   ("Invalid JSON response") so callers are not exposed to parser internals.
 */
async function parseResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  let body: T | ApiError | undefined;
  try {
    const text = typeof res.text === "function" ? await res.text() : null;
    if (text) {
      body = JSON.parse(text) as T | ApiError;
    } else if (typeof res.json === "function") {
      body = (await res.json()) as T | ApiError;
    }
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    throw new Error("Invalid JSON response");
  }
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      _authErrorHandler?.(res.status as 401 | 403);
    }
    const parsed = body as ApiError | undefined;
    const msg = parsed?.message ?? `Request failed (${res.status})`;
    const err = Object.assign(
      new Error(msg),
      { status: res.status },
      parsed ?? { error: `http_${res.status}` },
    );
    throw err;
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
        ...init,
        signal: init.signal ?? controller.signal,
      });
      if (!res.ok && res.status >= 500 && attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      return await parseResponse<T>(res);
    } catch (err) {
      /* Errors that already carry structured payloads (status, error, etc.)
         are re-thrown immediately — they should not be retried or wrapped. */
      if (
        err instanceof Error &&
        ("status" in err || err.message === "Invalid JSON response")
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
      throw Object.assign(new Error(message), { status: 0 });
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : Object.assign(new Error("request failed"), { status: 0 });
}

export const apiGet = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, {}, options);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

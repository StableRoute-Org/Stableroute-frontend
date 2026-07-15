const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

function parseApiBase(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Invalid StableRoute API base URL configuration");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Invalid StableRoute API base URL configuration");
  }
  return url;
}

const API_BASE_URL = parseApiBase(API_BASE);

function resolveApiUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("API request path must be a relative path starting with /");
  }
  const url = new URL(path, API_BASE_URL);
  if (url.origin !== API_BASE_URL.origin) {
    throw new Error("API request path must stay on the configured API origin");
  }
  return url.toString();
}

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/**
 * Register the single global auth-error handler.
 *
 * The latest registration replaces any previous handler. `ApiAuthGuard` calls
 * this while mounted inside `ToastProvider`, then calls the returned unregister
 * function on unmount. The guard is notified for backend `401` and `403`
 * responses, but the original request still rejects normally.
 *
 * @param handler - Callback invoked with the auth failure status.
 * @returns A cleanup function that unregisters `handler` if it is still active.
 */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/**
 * Fetch JSON from the StableRoute API.
 *
 * Requests are made relative to `NEXT_PUBLIC_STABLEROUTE_API_BASE` and include
 * `Content-Type: application/json` by default. `204 No Content` resolves to
 * `undefined`. Non-empty successful responses must be valid JSON. Failed
 * responses reject with an `Error` whose message comes from the backend
 * `ApiError.message` when present, with `status` and any parsed error fields
 * attached to the thrown object.
 *
 * @param path - Backend path beginning with `/`.
 * @param init - Optional fetch init merged with the default JSON header.
 * @returns The parsed response body typed as `T`.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(resolveApiUrl(path), {
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    ...init,
  });
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
    const msg = (body as ApiError | undefined)?.message ?? `HTTP ${res.status}`;
    const err = Object.assign(new Error(msg), { status: res.status }, body ?? {});
    throw err;
  }
  return body as T;
}

/** GET a JSON resource from the StableRoute API. */
export const apiGet = <T>(path: string) => apiFetch<T>(path);
/** POST a JSON body and parse the JSON response. */
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
/** PATCH a JSON body and parse the JSON response. */
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
/** DELETE a resource, resolving to `undefined` for a 204 response. */
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/**
 * Registers the single global auth-error handler used by the API client.
 *
 * The newest registered handler replaces any previous handler. The returned
 * unregister function clears the slot only when it still owns the current
 * handler, which prevents an older component cleanup from removing a newer
 * registration.
 */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/**
 * Sends a JSON-oriented request to the StableRoute API and returns the parsed
 * response body.
 *
 * `path` is resolved relative to `NEXT_PUBLIC_STABLEROUTE_API_BASE`. Requests
 * include `Content-Type: application/json` by default while preserving any
 * caller-provided headers. A `204` response resolves to `undefined`. Non-JSON
 * success bodies throw `Invalid JSON response`; failed responses throw an
 * `Error` carrying `status` plus any parsed `ApiError` fields.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
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

/** Sends a GET request and resolves with the parsed JSON response body. */
export const apiGet = <T>(path: string) => apiFetch<T>(path);

/** Sends a POST request with a JSON-encoded request body. */
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });

/** Sends a PATCH request with a JSON-encoded request body. */
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });

/** Sends a DELETE request and resolves when the API responds successfully. */
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

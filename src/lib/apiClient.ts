const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

/**
 * Shape of the JSON error envelope returned by the StableRoute backend for
 * non-2xx responses. Any field may be missing if the backend did not
 * produce a structured body; the helper functions below synthesise a
 * sensible `Error` from whatever is available.
 */
export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/**
 * Register a single auth-error handler that is invoked whenever a request
 * returns 401 (unauthenticated) or 403 (forbidden). The function returns
 * an unregister callback that should be called on unmount to release the
 * slot — `<ApiAuthGuard>` wires this to the toast provider.
 *
 * Only one handler can be active at a time. If a second handler is
 * registered, the first one is replaced; the returned unregister callback
 * from the first registration will not re-clear the new handler. Always
 * store and call the unregister function from the most recent call.
 *
 * Called once by `<ApiAuthGuard>` when it mounts inside `<ToastProvider>`.
 */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

/**
 * Low-level fetch helper used by `apiGet`, `apiPost`, `apiPatch`, and
 * `apiDelete`. Most callers should use one of those wrappers rather than
 * `apiFetch` directly.
 *
 * Behaviour:
 * - Sends `Content-Type: application/json` by default; callers can
 *   override or extend the headers via `init.headers`.
 * - Returns `undefined` for `204 No Content` responses (so callers can
 *   use the result type without an extra null check).
 * - For empty-bodied success responses, also returns `undefined`.
 * - Throws an `Error` with a `.status` property (and any fields from the
 *   `ApiError` envelope) on any non-2xx response. The auth-error handler
 *   is invoked automatically on 401/403 before the throw.
 * - Throws a plain `Error("Invalid JSON response")` if the server
 *   returned 2xx with a non-JSON body.
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

/**
 * `GET ${API_BASE}${path}` — returns the parsed JSON body. The 204
 * contract from `apiFetch` applies (returns `undefined`).
 */
export const apiGet = <T>(path: string) => apiFetch<T>(path);

/**
 * `POST ${API_BASE}${path}` with the body JSON-encoded. Use for create
 * and any non-idempotent action.
 */
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });

/**
 * `PATCH ${API_BASE}${path}` with the body JSON-encoded. Use for partial
 * updates.
 */
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });

/**
 * `DELETE ${API_BASE}${path}`. Returns `void`; if the backend returns
 * 204, the call resolves to `undefined`.
 */
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

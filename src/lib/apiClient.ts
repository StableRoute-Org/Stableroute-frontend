const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

/** Validates that a URL uses http(s) and is an absolute URL. */
export function validateApiBase(url: string): void {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      `NEXT_PUBLIC_STABLEROUTE_API_BASE must use http or https; got "${url}"`,
    );
  }
  try {
    new URL(url);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_STABLEROUTE_API_BASE must be a valid absolute URL; got "${url}"`,
    );
  }
}

validateApiBase(API_BASE);

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

/** Called once by <ApiAuthGuard> when it mounts inside <ToastProvider>. */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
}

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

export const apiGet = <T>(path: string) => apiFetch<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

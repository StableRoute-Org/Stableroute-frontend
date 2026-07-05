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

export const apiGet = <T>(path: string) => apiFetch<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body: unknown) =>
  apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) });
export const apiDelete = (path: string) =>
  apiFetch<void>(path, { method: "DELETE" });

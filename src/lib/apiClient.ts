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
};

type AuthErrorHandler = (status: 401 | 403) => void;
let _authErrorHandler: AuthErrorHandler | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Called once by <ApiAuthGuard> when it mounts inside <ToastProvider>. */
export function registerAuthErrorHandler(handler: AuthErrorHandler): () => void {
  _authErrorHandler = handler;
  return () => {
    if (_authErrorHandler === handler) _authErrorHandler = null;
  };
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
    const msg = (body as ApiError | undefined)?.message ?? `HTTP ${res.status}`;
    const err = Object.assign(new Error(msg), { status: res.status }, body ?? {});
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
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetch(`${getApiBase()}${path}`, {
        headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
        ...init,
      });
      if (!res.ok && res.status >= 500 && attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      return await parseResponse<T>(res);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
        continue;
      }
      throw err;
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

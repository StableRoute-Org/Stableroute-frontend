const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

const DEFAULT_TIMEOUT_MS = 10_000;

export type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};

export type ApiFetchOptions = RequestInit & {
  /** Request timeout in milliseconds. Set to 0 to disable the timeout. */
  timeoutMs?: number;
};

/** Error thrown when apiFetch aborts a request after its timeout expires. */
export class ApiTimeoutError extends Error {
  error = "timeout" as const;
  timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "ApiTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isApiTimeoutError(err: unknown): err is ApiTimeoutError {
  return err instanceof ApiTimeoutError;
}

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...fetchInit } = init;
  const controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const abortFromCaller = () => controller.abort(signal?.reason);
  if (signal?.aborted) {
    abortFromCaller();
  } else {
    signal?.addEventListener("abort", abortFromCaller, { once: true });
  }
  if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...fetchInit,
      headers: {
        "Content-Type": "application/json",
        ...(fetchInit.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (res.status === 204) return undefined as T;
    const body = (await res.json()) as T | ApiError;
    if (!res.ok) {
      throw Object.assign(new Error((body as ApiError).message), body as ApiError);
    }
    return body as T;
  } catch (err) {
    if (timedOut) throw new ApiTimeoutError(timeoutMs);
    throw err;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export const apiGet = <T>(path: string, options?: ApiFetchOptions) =>
  apiFetch<T>(path, options);
export const apiPost = <T>(
  path: string,
  body: unknown,
  options: ApiFetchOptions = {}
) =>
  apiFetch<T>(path, {
    ...options,
    method: "POST",
    body: JSON.stringify(body),
  });
export const apiPatch = <T>(
  path: string,
  body: unknown,
  options: ApiFetchOptions = {}
) =>
  apiFetch<T>(path, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(body),
  });
export const apiDelete = (path: string, options?: ApiFetchOptions) =>
  apiFetch<void>(path, { ...options, method: "DELETE" });

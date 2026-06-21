import {
  ApiTimeoutError,
  apiDelete,
  apiGet,
  isApiTimeoutError,
} from "../apiClient";

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: jest.fn(async () => body),
  } as unknown as Response;
}

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

describe("apiClient", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("returns JSON before the timeout and clears the timeout timer", async () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    const mockFetch = jest.fn().mockResolvedValueOnce(jsonResponse({ ok: true }));
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    await expect(apiGet<{ ok: boolean }>("/ok", { timeoutMs: 50 })).resolves.toEqual({
      ok: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:3001/ok",
      expect.objectContaining({
        headers: { "Content-Type": "application/json" },
        signal: expect.any(AbortSignal),
      })
    );
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("throws a typed timeout error when the timeout aborts fetch", async () => {
    jest.useFakeTimers();
    globalThis.fetch = jest.fn((_url, init) => {
      const signal = (init as RequestInit).signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(abortError()));
      });
    }) as unknown as typeof globalThis.fetch;

    const request = apiGet("/slow", { timeoutMs: 25 });
    jest.advanceTimersByTime(25);

    let caught: unknown;
    try {
      await request;
    } catch (err) {
      caught = err;
    }

    expect(caught).toBeInstanceOf(ApiTimeoutError);
    expect(caught).toMatchObject({
      error: "timeout",
      message: "Request timed out after 25ms",
      name: "ApiTimeoutError",
      timeoutMs: 25,
    });
    expect(isApiTimeoutError(caught)).toBe(true);
  });

  it("combines an external abort signal without converting it to a timeout", async () => {
    jest.useFakeTimers();
    const external = new AbortController();
    let fetchSignal: AbortSignal | null = null;
    globalThis.fetch = jest.fn((_url, init) => {
      fetchSignal = (init as RequestInit).signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        fetchSignal?.addEventListener("abort", () => reject(abortError()));
      });
    }) as unknown as typeof globalThis.fetch;

    const request = apiGet("/slow", {
      signal: external.signal,
      timeoutMs: 100,
    });
    external.abort();

    let caught: unknown;
    try {
      await request;
    } catch (err) {
      caught = err;
    }

    expect(fetchSignal).not.toBe(external.signal);
    expect(fetchSignal?.aborted).toBe(true);
    expect((caught as Error).name).toBe("AbortError");
    expect(isApiTimeoutError(caught)).toBe(false);
    jest.advanceTimersByTime(100);
  });

  it("preserves 204 no-content handling", async () => {
    const response = jsonResponse(null, true, 204);
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(response) as unknown as typeof globalThis.fetch;

    await expect(apiDelete("/gone", { timeoutMs: 0 })).resolves.toBeUndefined();
    expect(response.json).not.toHaveBeenCalled();
  });

  it("preserves ApiError body details on non-ok responses", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      jsonResponse(
        {
          error: "invalid_request",
          message: "bad request",
          requestId: "req_123",
        },
        false
      )
    ) as unknown as typeof globalThis.fetch;

    await expect(apiGet("/bad", { timeoutMs: 0 })).rejects.toMatchObject({
      error: "invalid_request",
      message: "bad request",
      requestId: "req_123",
    });
  });
});

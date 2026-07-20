import { apiFetch, registerAuthErrorHandler } from "../apiClient";

function mockResponse(status: number, body: string, contentType = "application/json") {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body),
    headers: { get: () => contentType },
  } as unknown as Response);
}

afterEach(() => jest.restoreAllMocks());

describe("apiFetch", () => {
  it("returns parsed JSON on success", async () => {
    mockResponse(200, JSON.stringify({ id: 1 }));
    await expect(apiFetch("/test")).resolves.toEqual({ id: 1 });
  });

  it("returns undefined for 204", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
      text: () => Promise.resolve(""),
    } as unknown as Response);
    await expect(apiFetch("/test")).resolves.toBeUndefined();
  });

  it("throws with message from JSON error body", async () => {
    mockResponse(400, JSON.stringify({ error: "bad_request", message: "Invalid input" }));
    await expect(apiFetch("/test")).rejects.toThrow("Invalid input");
  });

  it("throws HTTP status when error body is empty", async () => {
    mockResponse(500, "");
    await expect(apiFetch("/test")).rejects.toThrow("HTTP 500");
  });

  it("throws HTTP status when error body is non-JSON", async () => {
    mockResponse(503, "Service Unavailable", "text/plain");
    await expect(apiFetch("/test")).rejects.toThrow("HTTP 503");
  });

  it("throws on non-JSON success body", async () => {
    mockResponse(200, "not json");
    await expect(apiFetch("/test")).rejects.toThrow("Invalid JSON response");
  });

  it("attaches status to the thrown error for non-auth failures", async () => {
    mockResponse(400, JSON.stringify({ error: "bad_request", message: "Invalid input" }));
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error & { status: number };
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(400);
  });
});

describe("registerAuthErrorHandler", () => {
  it("calls the handler with 401 when the server returns 401", async () => {
    mockResponse(401, JSON.stringify({ error: "unauthorized", message: "Not authenticated" }));
    const handler = jest.fn();
    const unregister = registerAuthErrorHandler(handler);

    await apiFetch("/secure").catch(() => {/* expected rejection */});

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(401);
    unregister();
  });

  it("calls the handler with 403 when the server returns 403", async () => {
    mockResponse(403, JSON.stringify({ error: "forbidden", message: "Access denied" }));
    const handler = jest.fn();
    const unregister = registerAuthErrorHandler(handler);

    await apiFetch("/secure").catch(() => {/* expected rejection */});

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(403);
    unregister();
  });

  it("does NOT call the handler for non-auth errors", async () => {
    mockResponse(500, "");
    const handler = jest.fn();
    const unregister = registerAuthErrorHandler(handler);

    await apiFetch("/test").catch(() => {/* expected rejection */});

    expect(handler).not.toHaveBeenCalled();
    unregister();
  });

  it("does NOT call the handler after unregistering", async () => {
    mockResponse(401, JSON.stringify({ error: "unauthorized", message: "Gone" }));
    const handler = jest.fn();
    const unregister = registerAuthErrorHandler(handler);
    unregister(); // remove before the request

    await apiFetch("/secure").catch(() => {/* expected rejection */});

    expect(handler).not.toHaveBeenCalled();
  });

  it("still throws the error even when the handler is registered", async () => {
    mockResponse(401, JSON.stringify({ error: "unauthorized", message: "Not authenticated" }));
    const unregister = registerAuthErrorHandler(jest.fn());

    await expect(apiFetch("/secure")).rejects.toThrow("Not authenticated");
    unregister();
  });

  it("attaches status 401 to the thrown error", async () => {
    mockResponse(401, JSON.stringify({ error: "unauthorized", message: "Not authenticated" }));
    const unregister = registerAuthErrorHandler(jest.fn());

    const err = await apiFetch("/secure").catch((e: unknown) => e) as Error & { status: number };
    expect(err.status).toBe(401);
    unregister();
  });

  it("retries idempotent GET requests on 5xx with backoff", async () => {
    jest.useFakeTimers();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        status: 503,
        ok: false,
        text: () => Promise.resolve(""),
      } as unknown as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const promise = apiFetch("/retry-me", {}, { retry: { maxAttempts: 2, baseDelayMs: 50 } });
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("does not retry non-GET methods", async () => {
    mockResponse(503, "");
    await expect(
      apiFetch("/retry-me", { method: "POST", body: "{}" }, { retry: { maxAttempts: 3 } }),
    ).rejects.toThrow("HTTP 503");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

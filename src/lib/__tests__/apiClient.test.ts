import {
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
  registerAuthErrorHandler,
} from "../apiClient";

function loadApiClientWithBase(base: string) {
  const previousBase = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
  try {
    jest.resetModules();
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = base;
    let loadedApiClient: typeof import("../apiClient") | undefined;
    jest.isolateModules(() => {
      loadedApiClient = require("../apiClient") as typeof import("../apiClient");
    });
    return loadedApiClient!;
  } finally {
    if (previousBase === undefined) {
      delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    } else {
      process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = previousBase;
    }
    jest.resetModules();
  }
}

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
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
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

  it("uses a valid configured http API base", async () => {
    const { apiFetch: configuredApiFetch } = loadApiClientWithBase("https://api.example.test");
    mockResponse(200, JSON.stringify({ id: 2 }));

    await expect(configuredApiFetch("/test")).resolves.toEqual({ id: 2 });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.test/test",
      expect.any(Object)
    );
  });

  it("rejects non-http API base schemes without leaking the raw value", () => {
    const rawBase = "javascript:alert(1)";

    try {
      loadApiClientWithBase(rawBase);
      throw new Error("expected loadApiClientWithBase to throw");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toBe("Invalid StableRoute API base URL configuration");
      expect(message).not.toContain(rawBase);
    }
  });

  it("rejects unparseable API base values without leaking the raw value", () => {
    const rawBase = "not a url";

    try {
      loadApiClientWithBase(rawBase);
      throw new Error("expected loadApiClientWithBase to throw");
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toBe("Invalid StableRoute API base URL configuration");
      expect(message).not.toContain(rawBase);
    }
  });

  it("rejects absolute request paths before fetch", async () => {
    global.fetch = jest.fn();

    await expect(apiFetch("https://evil.example/api")).rejects.toThrow(
      "API request path must be a relative path starting with /"
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects protocol-relative request paths before fetch", async () => {
    global.fetch = jest.fn();

    await expect(apiFetch("//evil.example/api")).rejects.toThrow(
      "API request path must be a relative path starting with /"
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects backslash paths that would resolve to another origin", async () => {
    global.fetch = jest.fn();

    await expect(apiFetch("/\\evil.example/api")).rejects.toThrow(
      "API request path must stay on the configured API origin"
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("posts JSON through the shared wrapper", async () => {
    mockResponse(200, JSON.stringify({ ok: true }));

    await expect(apiPost("/test", { label: "prod" })).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ label: "prod" }),
      })
    );
  });

  it("patches JSON through the shared wrapper", async () => {
    mockResponse(200, JSON.stringify({ ok: true }));

    await expect(apiPatch("/test", { fee_bps: 10 })).resolves.toEqual({ ok: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ fee_bps: 10 }),
      })
    );
  });

  it("deletes through the shared wrapper", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
      text: () => Promise.resolve(""),
    } as unknown as Response);

    await expect(apiDelete("/test")).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({ method: "DELETE" })
    );
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
});

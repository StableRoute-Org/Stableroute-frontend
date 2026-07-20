import { apiFetch, registerAuthErrorHandler, sanitizeErrorMessage } from "../apiClient";

function mockResponse(status: number, body: string, contentType = "application/json") {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body),
    headers: { get: () => contentType },
  } as unknown as Response);
}

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// sanitizeErrorMessage — unit tests
// ---------------------------------------------------------------------------

describe("sanitizeErrorMessage", () => {
  // --- query string stripping ---

  it("strips a single query parameter from a message", () => {
    expect(sanitizeErrorMessage("Bad request: ?amount=1000000")).toBe(
      "Bad request:",
    );
  });

  it("strips multiple query parameters", () => {
    expect(
      sanitizeErrorMessage(
        "Failed: ?source_asset=USDC&dest_asset=EURC&amount=1000000",
      ),
    ).toBe("Failed:");
  });

  it("strips query parameters mid-sentence", () => {
    expect(
      sanitizeErrorMessage("route ?source=USDC&dest=EURC not found"),
    ).toBe("route not found");
  });

  it("strips lone ampersand-prefixed parameter", () => {
    expect(sanitizeErrorMessage("error &token=abc123defghijklmnop")).toBe(
      "error",
    );
  });

  it("leaves a plain message without query params unchanged", () => {
    expect(sanitizeErrorMessage("Invalid input")).toBe("Invalid input");
  });

  it("leaves HTTP status messages unchanged", () => {
    expect(sanitizeErrorMessage("HTTP 500")).toBe("HTTP 500");
  });

  it("leaves timeout message unchanged", () => {
    expect(sanitizeErrorMessage("Request timed out")).toBe(
      "Request timed out",
    );
  });

  it("leaves network failure message unchanged", () => {
    expect(sanitizeErrorMessage("Network request failed")).toBe(
      "Network request failed",
    );
  });

  it("leaves an empty string as empty", () => {
    expect(sanitizeErrorMessage("")).toBe("");
  });

  // --- hex token redaction ---

  it("redacts a 20-character hex token", () => {
    expect(sanitizeErrorMessage("key: 1a2b3c4d5e6f7a8b9c0d")).toBe(
      "key: [redacted]",
    );
  });

  it("redacts a long API key that is all hex", () => {
    expect(
      sanitizeErrorMessage("Unauthorized: deadbeefcafebabedeadbeefcafebabe"),
    ).toBe("Unauthorized: [redacted]");
  });

  it("does NOT redact a hex string shorter than 20 chars", () => {
    expect(sanitizeErrorMessage("ref: 1a2b3c4d5e6f")).toBe(
      "ref: 1a2b3c4d5e6f",
    );
  });

  it("redacts exactly 20 hex characters (boundary)", () => {
    expect(sanitizeErrorMessage("val: 1a2b3c4d5e6f7a8b9c0d")).toBe(
      "val: [redacted]",
    );
  });

  // --- Base58 token redaction ---

  it("redacts a Stellar public key (Base58, 56 chars)", () => {
    const stellarKey =
      "GBVHELLD2JE235Y2NGTDT3MWI3T65ON6SY4N6FBHYVDAQ5FZC2CP5QXH";
    expect(sanitizeErrorMessage(`Invalid key: ${stellarKey}`)).toBe(
      "Invalid key: [redacted]",
    );
  });

  it("redacts a 32-character Base58 token", () => {
    expect(
      sanitizeErrorMessage("token: 3yMApqCuCjXDWPrbjfR5mjCPTHqFG3u"),
    ).toBe("token: [redacted]");
  });

  it("does NOT redact a Base58 string shorter than 20 chars", () => {
    expect(sanitizeErrorMessage("ref: 3yMApqCuCjXDWPrb")).toBe(
      "ref: 3yMApqCuCjXDWPrb",
    );
  });

  // --- combined scenarios ---

  it("strips query params AND redacts hex token in one message", () => {
    const key = "deadbeefcafebabedeadbeef";
    expect(
      sanitizeErrorMessage(
        `Failed ?source_asset=USDC&dest_asset=EURC secret: ${key}`,
      ),
    ).toBe("Failed secret: [redacted]");
  });

  it("strips query params containing sensitive asset codes", () => {
    expect(
      sanitizeErrorMessage(
        "Quote error: ?source_asset=USDC&dest_asset=EURC&amount=5000000",
      ),
    ).toBe("Quote error:");
  });

  it("handles a message that is entirely a query string", () => {
    expect(sanitizeErrorMessage("?foo=bar&baz=qux")).toBe("");
  });

  it("collapses extra spaces left after stripping", () => {
    expect(
      sanitizeErrorMessage("error  ?a=b  extra"),
    ).toBe("error extra");
  });

  it("does not corrupt a requestId that looks like a normal short string", () => {
    // requestIds are short alphanumeric strings — should not be redacted
    expect(sanitizeErrorMessage("Bad request [req-abc123]")).toBe(
      "Bad request [req-abc123]",
    );
  });

  it("preserves a message with a question mark that is not a query string", () => {
    // Plain question mark without key=value format should not be stripped
    expect(sanitizeErrorMessage("Are you authenticated?")).toBe(
      "Are you authenticated?",
    );
  });
});

// ---------------------------------------------------------------------------
// apiFetch — integration tests (error messages are sanitized at throw site)
// ---------------------------------------------------------------------------

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

  // --- sensitive data is sanitized in the thrown error message ---

  it("strips query params that the server echoes back in its error message", async () => {
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_params",
        message: "Bad request: ?source_asset=USDC&dest_asset=EURC&amount=1000000",
      }),
    );
    const err = await apiFetch("/api/v1/quote?source_asset=USDC&dest_asset=EURC&amount=1000000")
      .catch((e: unknown) => e) as Error;
    expect(err.message).toBe("Bad request:");
    expect(err.message).not.toContain("USDC");
    expect(err.message).not.toContain("EURC");
    expect(err.message).not.toContain("1000000");
  });

  it("redacts a hex API key that the server includes in its error message", async () => {
    const hexKey = "deadbeefcafebabedeadbeefcafebabe";
    mockResponse(
      401,
      JSON.stringify({
        error: "unauthorized",
        message: `Invalid API key: ${hexKey}`,
      }),
    );
    const unregister = registerAuthErrorHandler(jest.fn());
    const err = await apiFetch("/secure").catch((e: unknown) => e) as Error;
    expect(err.message).toBe("Invalid API key: [redacted]");
    expect(err.message).not.toContain(hexKey);
    unregister();
  });

  it("redacts a Stellar wallet address echoed in an error message", async () => {
    const walletAddress = "GBVHELLD2JE235Y2NGTDT3MWI3T65ON6SY4N6FBHYVDAQ5FZC2CP5QXH";
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_address",
        message: `Unknown destination: ${walletAddress}`,
      }),
    );
    const err = await apiFetch("/api/v1/quote").catch((e: unknown) => e) as Error;
    expect(err.message).toBe("Unknown destination: [redacted]");
    expect(err.message).not.toContain(walletAddress);
  });

  it("preserves requestId on the error object even after sanitizing the message", async () => {
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_params",
        message: "Bad request: ?amount=1000000",
        requestId: "req-abc-123",
      }),
    );
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error & { requestId?: string };
    expect(err.message).toBe("Bad request:");
    expect(err.requestId).toBe("req-abc-123");
  });

  it("plain error messages without sensitive data pass through unchanged", async () => {
    mockResponse(422, JSON.stringify({ error: "unprocessable", message: "Amount must be positive" }));
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error;
    expect(err.message).toBe("Amount must be positive");
  });
});

// ---------------------------------------------------------------------------
// registerAuthErrorHandler
// ---------------------------------------------------------------------------

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

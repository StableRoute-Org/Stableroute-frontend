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

  // --- prefixed secret key redaction ---

  it("redacts a sk_live_ prefixed key", () => {
    expect(
      sanitizeErrorMessage("Invalid key: sk_live_abcdef1234567890abcdef"),
    ).toBe("Invalid key: [redacted]");
  });

  it("redacts a pk_test_ prefixed key", () => {
    expect(
      sanitizeErrorMessage("Rejected: pk_test_ZxYwVuTsRqPoNmLk1234"),
    ).toBe("Rejected: [redacted]");
  });

  it("does not redact a short prefixed value (under 16 alphanum suffix chars)", () => {
    // "sk_test_shortval" — suffix "shortval" is only 8 chars, should NOT be redacted
    expect(sanitizeErrorMessage("ref: sk_test_shortval")).toBe(
      "ref: sk_test_shortval",
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

// ---------------------------------------------------------------------------
// Network and timeout errors
// ---------------------------------------------------------------------------

describe("network and timeout errors", () => {
  it("throws 'Request timed out' when fetch is aborted via timeout", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );
    const errorPromise = apiFetch("/slow", {}, { timeoutMs: 100 }).catch((e: unknown) => e);
    // Advance past timeout so AbortController fires, then flush microtasks
    jest.advanceTimersByTime(200);
    const err = await errorPromise as Error;
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Request timed out");
    jest.useRealTimers();
  });

  it("throws 'Network request failed' on a generic fetch rejection", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiFetch("/test")).rejects.toThrow("Network request failed");
  });

  it("retries network errors on GET requests and succeeds on second attempt", async () => {
    jest.useFakeTimers();
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ ok: true })),
      } as unknown as Response);
    global.fetch = fetchMock as unknown as typeof global.fetch;

    const promise = apiFetch("/retry-net", {}, { retry: { maxAttempts: 2, baseDelayMs: 50 } });
    await jest.advanceTimersByTimeAsync(50);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it("throws after exhausting all retry attempts on network error", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    // Attach .catch immediately so the rejection is always handled
    const settled = apiFetch("/fail", {}, { retry: { maxAttempts: 2, baseDelayMs: 10 } })
      .then(() => ({ ok: true as const }))
      .catch((e: unknown) => ({ ok: false as const, err: e as Error }));
    await jest.advanceTimersByTimeAsync(10);
    const result = await settled;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.err.message).toBe("Network request failed");
    jest.useRealTimers();
  });
});

// ---------------------------------------------------------------------------
// Helper functions: apiGet, apiPost, apiPatch, apiDelete
// ---------------------------------------------------------------------------

describe("helper functions", () => {
  it("apiGet calls apiFetch with GET method", async () => {
    mockResponse(200, JSON.stringify({ items: [] }));
    const { apiGet } = await import("../apiClient");
    await expect(apiGet("/api/v1/pairs")).resolves.toEqual({ items: [] });
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toMatchObject({});
  });

  it("apiPost calls apiFetch with POST method and JSON body", async () => {
    mockResponse(200, JSON.stringify({ id: 1 }));
    const { apiPost } = await import("../apiClient");
    await expect(apiPost("/api/v1/pairs", { source: "USDC", destination: "EURC" })).resolves.toEqual({ id: 1 });
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toMatchObject({ method: "POST" });
  });

  it("apiPatch calls apiFetch with PATCH method and JSON body", async () => {
    mockResponse(200, JSON.stringify({ updated: true }));
    const { apiPatch } = await import("../apiClient");
    await expect(apiPatch("/api/v1/pairs/1", { active: false })).resolves.toEqual({ updated: true });
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toMatchObject({ method: "PATCH" });
  });

  it("apiDelete calls apiFetch with DELETE method and returns undefined on 204", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
      text: () => Promise.resolve(""),
    } as unknown as Response);
    const { apiDelete } = await import("../apiClient");
    await expect(apiDelete("/api/v1/pairs/1")).resolves.toBeUndefined();
    expect((global.fetch as jest.Mock).mock.calls[0][1]).toMatchObject({ method: "DELETE" });
  });
});

// ---------------------------------------------------------------------------
// Branch coverage: error body without `error` or `requestId` fields
// ---------------------------------------------------------------------------

describe("error body field coverage", () => {
  it("does not attach error field when the body omits it", async () => {
    // Body has only `message`, no `error` code
    mockResponse(400, JSON.stringify({ message: "Something went wrong" }));
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error & { error?: string };
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("Something went wrong");
    expect(err.error).toBeUndefined();
  });

  it("does not attach requestId when the body omits it", async () => {
    mockResponse(400, JSON.stringify({ error: "bad_request", message: "Missing field" }));
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error & { requestId?: string };
    expect(err.requestId).toBeUndefined();
  });

  it("attaches both error code and requestId when both are present", async () => {
    mockResponse(
      422,
      JSON.stringify({ error: "validation_error", message: "Invalid amount", requestId: "req-xyz-999" }),
    );
    const err = await apiFetch("/test").catch((e: unknown) => e) as Error & {
      error?: string;
      requestId?: string;
      status: number;
    };
    expect(err.message).toBe("Invalid amount");
    expect(err.error).toBe("validation_error");
    expect(err.requestId).toBe("req-xyz-999");
    expect(err.status).toBe(422);
  });
});

// ---------------------------------------------------------------------------
// Sensitive URL parameters — comprehensive redaction scenarios
// ---------------------------------------------------------------------------

describe("sensitive URL parameter redaction", () => {
  it("does not expose source_asset in the toast-visible error message", async () => {
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_params",
        message: "Invalid request: ?source_asset=USDC&dest_asset=EURC&amount=5000000",
      }),
    );
    const err = await apiFetch(
      "/api/v1/quote?source_asset=USDC&dest_asset=EURC&amount=5000000",
    ).catch((e: unknown) => e) as Error;
    expect(err.message).not.toMatch(/source_asset/);
    expect(err.message).not.toMatch(/dest_asset/);
    expect(err.message).not.toMatch(/amount/);
    expect(err.message).not.toMatch(/USDC/);
    expect(err.message).not.toMatch(/EURC/);
    expect(err.message).not.toMatch(/5000000/);
    expect(err.message).toBe("Invalid request:");
  });

  it("does not expose a raw hex API key echoed in a 401 message", async () => {
    // Pure hex keys (no prefix/underscores) are matched by the sanitizer.
    // Keys like deadbeefcafe... that appear as word-boundary tokens get redacted.
    const apiKey = "deadbeefcafebabedeadbeef12345678";
    mockResponse(
      401,
      JSON.stringify({
        error: "unauthorized",
        message: `Unrecognized API key: ${apiKey}`,
      }),
    );
    const unregister = registerAuthErrorHandler(jest.fn());
    const err = await apiFetch("/api/v1/pairs").catch((e: unknown) => e) as Error;
    expect(err.message).not.toContain(apiKey);
    expect(err.message).toContain("[redacted]");
    expect(err.message).toBe("Unrecognized API key: [redacted]");
    unregister();
  });

  it("does not expose a prefixed API key (sk_live_ format) echoed in a 401 message", async () => {
    // Prefixed keys like sk_live_xxx, pk_test_xxx are also redacted
    const apiKey = "sk_live_abcdef1234567890abcdef";
    mockResponse(
      401,
      JSON.stringify({
        error: "unauthorized",
        message: `Unrecognized API key: ${apiKey}`,
      }),
    );
    const unregister = registerAuthErrorHandler(jest.fn());
    const err = await apiFetch("/api/v1/pairs").catch((e: unknown) => e) as Error;
    expect(err.message).not.toContain(apiKey);
    expect(err.message).toContain("[redacted]");
    unregister();
  });

  it("does not expose a Stellar G-address echoed in a 400 message", async () => {
    const gAddress = "GCKFBEIYTKP6RZNFKBEUYYTNWPMJCXMJFKTHKOBKNZ6SBPBVZWT73KMX";
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_address",
        message: `Destination not found: ${gAddress}`,
      }),
    );
    const err = await apiFetch("/api/v1/quote").catch((e: unknown) => e) as Error;
    expect(err.message).not.toContain(gAddress);
    expect(err.message).toContain("[redacted]");
  });

  it("sanitizes a message containing both a query param and a secret token", async () => {
    const secret = "aabbccddeeff00112233445566778899";
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_request",
        message: `Failed ?dest_asset=EURC token=${secret}`,
      }),
    );
    const err = await apiFetch("/api/v1/quote?dest_asset=EURC").catch((e: unknown) => e) as Error;
    expect(err.message).not.toContain("EURC");
    expect(err.message).not.toContain(secret);
    expect(err.message).toBe("Failed token=[redacted]");
  });

  it("preserves requestId for support correlation even when message is fully sanitized", async () => {
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_params",
        message: "?source_asset=USDC&dest_asset=EURC",
        requestId: "support-ref-42",
      }),
    );
    const err = await apiFetch("/api/v1/quote?source_asset=USDC").catch(
      (e: unknown) => e,
    ) as Error & { requestId?: string };
    expect(err.message).toBe("");
    expect(err.requestId).toBe("support-ref-42");
  });

  it("strips a webhook secret URL parameter from an error message", async () => {
    mockResponse(
      400,
      JSON.stringify({
        error: "invalid_webhook",
        message: "Webhook validation failed: ?secret=mysecretvalue123",
      }),
    );
    const err = await apiFetch("/api/v1/webhooks").catch((e: unknown) => e) as Error;
    expect(err.message).toBe("Webhook validation failed:");
    expect(err.message).not.toContain("secret");
    expect(err.message).not.toContain("mysecretvalue123");
  });

  it("does not redact short human-readable values (requestId-like strings)", async () => {
    mockResponse(
      404,
      JSON.stringify({
        error: "not_found",
        message: "Pair abc123 not found",
        requestId: "req-7f3a",
      }),
    );
    const err = await apiFetch("/api/v1/pairs/abc123").catch((e: unknown) => e) as Error & {
      requestId?: string;
    };
    // "abc123" is only 6 chars — should NOT be redacted
    expect(err.message).toBe("Pair abc123 not found");
    expect(err.requestId).toBe("req-7f3a");
  });

  it("handles a HEAD request timeout without leaking URL params", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );
    const errorPromise = apiFetch(
      "/api/v1/stats?api_key=supersecretkey1234567890",
      { method: "HEAD" },
      { timeoutMs: 50 },
    ).catch((e: unknown) => e);
    jest.advanceTimersByTime(100);
    const err = await errorPromise as Error;
    expect(err.message).toBe("Request timed out");
    expect(err.message).not.toContain("api_key");
    expect(err.message).not.toContain("supersecretkey");
    jest.useRealTimers();
  });
});

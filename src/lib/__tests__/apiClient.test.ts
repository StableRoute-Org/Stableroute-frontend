import { apiFetch, registerAuthErrorHandler } from "../apiClient";

function mockResponse(status: number, body: string) {
  global.fetch = jest.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body),
  } as unknown as Response);
}

afterEach(() => jest.restoreAllMocks());

describe("apiFetch", () => {
  describe("successful responses", () => {
    it("returns parsed JSON on 200", async () => {
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

    it("returns undefined for 200 with empty body", async () => {
      mockResponse(200, "");
      await expect(apiFetch("/test")).resolves.toBeUndefined();
    });
  });

  describe("error responses with parseable JSON body", () => {
    it("throws with message from JSON error body", async () => {
      mockResponse(
        400,
        JSON.stringify({ error: "bad_request", message: "Invalid input" }),
      );
      await expect(apiFetch("/test")).rejects.toThrow("Invalid input");
    });

    it("attaches status and error to the thrown error for JSON ApiError", async () => {
      mockResponse(
        400,
        JSON.stringify({ error: "bad_request", message: "Invalid input" }),
      );
      const err = (await apiFetch("/test").catch((e: unknown) => e)) as Error &
        Record<string, unknown>;
      expect(err).toBeInstanceOf(Error);
      expect(err.status).toBe(400);
      expect(err.error).toBe("bad_request");
    });
  });

  describe("error responses with empty body", () => {
    it("throws Request failed with status when body is empty on 5xx", async () => {
      mockResponse(500, "");
      const err = (await apiFetch("/test").catch((e: unknown) => e)) as Error &
        Record<string, unknown>;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Request failed (500)");
      expect(err.status).toBe(500);
      expect(err.error).toBe("http_500");
    });

    it("throws Request failed with status when body is empty on 4xx", async () => {
      mockResponse(422, "");
      const err = (await apiFetch("/test").catch((e: unknown) => e)) as Error &
        Record<string, unknown>;
      expect(err.message).toBe("Request failed (422)");
      expect(err.status).toBe(422);
      expect(err.error).toBe("http_422");
    });
  });

  describe("error responses with non-JSON body", () => {
    it("throws Request failed with status when body is HTML", async () => {
      mockResponse(502, "<html><body>Bad Gateway</body></html>");
      const err = (await apiFetch("/test").catch((e: unknown) => e)) as Error &
        Record<string, unknown>;
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe("Request failed (502)");
      expect(err.status).toBe(502);
      expect(err.error).toBe("http_502");
    });

    it("throws Request failed with status when body is plain text on error", async () => {
      mockResponse(503, "Service Unavailable");
      const err = (await apiFetch("/test").catch((e: unknown) => e)) as Error &
        Record<string, unknown>;
      expect(err.message).toBe("Request failed (503)");
      expect(err.status).toBe(503);
      expect(err.error).toBe("http_503");
    });
  });

  describe("non-JSON success body", () => {
    it("throws Invalid JSON response for non-JSON body on 200", async () => {
      mockResponse(200, "not json");
      await expect(apiFetch("/test")).rejects.toThrow("Invalid JSON response");
    });
  });

  describe("auth error handler", () => {
    it("calls the handler with 401 when the server returns 401", async () => {
      mockResponse(
        401,
        JSON.stringify({ error: "unauthorized", message: "Not authenticated" }),
      );
      const handler = jest.fn();
      const unregister = registerAuthErrorHandler(handler);

      await apiFetch("/secure").catch(() => {
        /* expected rejection */
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(401);
      unregister();
    });

    it("calls the handler with 403 when the server returns 403", async () => {
      mockResponse(
        403,
        JSON.stringify({ error: "forbidden", message: "Access denied" }),
      );
      const handler = jest.fn();
      const unregister = registerAuthErrorHandler(handler);

      await apiFetch("/secure").catch(() => {
        /* expected rejection */
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(403);
      unregister();
    });

    it("still calls the handler for 401 even with non-JSON body", async () => {
      mockResponse(401, "Unauthorized");
      const handler = jest.fn();
      const unregister = registerAuthErrorHandler(handler);

      await apiFetch("/secure").catch(() => {
        /* expected rejection */
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(401);
      unregister();
    });

    it("does NOT call the handler for non-auth errors", async () => {
      mockResponse(500, "");
      const handler = jest.fn();
      const unregister = registerAuthErrorHandler(handler);

      await apiFetch("/test").catch(() => {
        /* expected rejection */
      });

      expect(handler).not.toHaveBeenCalled();
      unregister();
    });

    it("does NOT call the handler after unregistering", async () => {
      mockResponse(
        401,
        JSON.stringify({ error: "unauthorized", message: "Gone" }),
      );
      const handler = jest.fn();
      const unregister = registerAuthErrorHandler(handler);
      unregister(); // remove before the request

      await apiFetch("/secure").catch(() => {
        /* expected rejection */
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("still throws the error even when the handler is registered", async () => {
      mockResponse(
        401,
        JSON.stringify({ error: "unauthorized", message: "Not authenticated" }),
      );
      const unregister = registerAuthErrorHandler(jest.fn());

      await expect(apiFetch("/secure")).rejects.toThrow("Not authenticated");
      unregister();
    });

    it("attaches status 401 to the thrown error", async () => {
      mockResponse(
        401,
        JSON.stringify({ error: "unauthorized", message: "Not authenticated" }),
      );
      const unregister = registerAuthErrorHandler(jest.fn());

      const err = (await apiFetch("/secure").catch(
        (e: unknown) => e,
      )) as Error & Record<string, unknown>;
      expect(err.status).toBe(401);
      unregister();
    });
  });

  describe("retry behaviour", () => {
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

      const promise = apiFetch(
        "/retry-me",
        {},
        { retry: { maxAttempts: 2, baseDelayMs: 50 } },
      );
      await jest.advanceTimersByTimeAsync(50);
      await expect(promise).resolves.toEqual({ ok: true });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      jest.useRealTimers();
    });

    it("does not retry non-GET methods", async () => {
      mockResponse(503, "");
      await expect(
        apiFetch(
          "/retry-me",
          { method: "POST", body: "{}" },
          { retry: { maxAttempts: 3 } },
        ),
      ).rejects.toThrow("Request failed (503)");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("retries on network errors and eventually succeeds", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce({
          status: 200,
          ok: true,
          text: () => Promise.resolve(JSON.stringify({ ok: true })),
        } as unknown as Response);
      const promise = apiFetch(
        "/retry-me",
        {},
        { retry: { maxAttempts: 3, baseDelayMs: 10 } },
      );
      await expect(promise).resolves.toEqual({ ok: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("gives up on network errors after exhausting attempts", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new TypeError("Failed to fetch"));
      const promise = apiFetch(
        "/fail",
        {},
        { retry: { maxAttempts: 2, baseDelayMs: 10 } },
      );
      await expect(promise).rejects.toThrow("Network request failed");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("throws immediately for already-structured errors without retry", async () => {
      jest.useFakeTimers();
      mockResponse(400, JSON.stringify({ error: "bad_request", message: "Bad" }));
      const promise = apiFetch(
        "/no-retry",
        {},
        { retry: { maxAttempts: 3, baseDelayMs: 10 } },
      );
      await expect(promise).rejects.toThrow("Bad");
      /* 4xx should not be retried — only one fetch. */
      expect(global.fetch).toHaveBeenCalledTimes(1);
      jest.useRealTimers();
    });
  });
});

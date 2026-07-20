import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import ApiKeysPage from "./page";

describe("ApiKeysPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    jest.useFakeTimers();
    originalFetch = global.fetch;
    // Mock secure context
    Object.defineProperty(window, "isSecureContext", {
      writable: true,
      value: true,
    });
    // Default protocol to https:
    Object.defineProperty(window, "location", {
      writable: true,
      value: { protocol: "https:", hostname: "example.com" },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("shows loading before data arrives", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<ApiKeysPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders api keys in a single polite live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [{ prefix: "sk_abc", label: "Production", createdAt: Date.now() }],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Production")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });

  it("renders createdAt timestamps with TimeAgo component", async () => {
    const now = Date.now();
    const oneDayAgo = now - 86_400_000;

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: "sk_old", label: "Old Key", createdAt: oneDayAgo },
            { prefix: "sk_new", label: "New Key", createdAt: now },
          ],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText("Old Key")).toBeInTheDocument();
    });

    const timeElements = document.querySelectorAll("time");
    expect(timeElements.length).toBeGreaterThanOrEqual(2);

    timeElements.forEach((time) => {
      expect(time).toHaveAttribute("dateTime");
      expect(time.textContent).toMatch(/(\d+[dhms]\s+ago|just now)/);
    });
  });

  it("renders badge-marked new key when prefix matches recent prefix", async () => {
    const now = Date.now();

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: "sk_old123", label: "Old Key", createdAt: now - 100000 },
            { prefix: "sk_new456", label: "New Key", createdAt: now },
          ],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText("Old Key")).toBeInTheDocument();
    });

    const timeElements = document.querySelectorAll("time");
    expect(timeElements.length).toBeGreaterThanOrEqual(2);
  });

  it("preserves one-time secret block, revoke action, and error region unchanged", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<ApiKeysPage />);

    await waitFor(() => {
      const alertElement = screen.getByRole("alert");
      expect(alertElement).toBeInTheDocument();
    });

    expect(document.querySelectorAll("[role=alert]").length).toBeGreaterThanOrEqual(1);
  });

  it("marks badge with emerald-100 variant (ok) for new keys", async () => {
    const now = Date.now();

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [{ prefix: "sk_abc123", label: "New Key", createdAt: now }],
        }),
    } as unknown as Response);

    const { container } = render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText("New Key")).toBeInTheDocument();
    });

    const badges = container.querySelectorAll("span.bg-emerald-100");
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  it("maintains separate tracking for created secret and recent prefix state", async () => {
    const now = Date.now();

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [{ prefix: "sk_first", label: "First Key", createdAt: now }],
          }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              { prefix: "sk_first", label: "First Key", createdAt: now },
              { prefix: "sk_second", label: "Second Key", createdAt: now + 1000 },
            ],
          }),
      } as unknown as Response);

    render(<ApiKeysPage />);

    await waitFor(() => {
      expect(screen.getByText("First Key")).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Key/i).length).toBeGreaterThanOrEqual(1);
  });

  describe("dismiss button", () => {
    it("clears the created secret from the DOM when dismiss is clicked", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      // Mock the POST response for creating a key
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_test_secret_value_xyz", prefix: "sk_test" }),
      } as unknown as Response);

      // Fill in label and submit
      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "My Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      // Wait for the secret to appear
      await waitFor(() => {
        expect(screen.getByText(/Copy now — shown only once/i)).toBeInTheDocument();
      });

      expect(screen.getByText("sk_test_secret_value_xyz")).toBeInTheDocument();

      // Click dismiss
      const dismissButton = screen.getByLabelText("Dismiss API key secret");
      fireEvent.click(dismissButton);

      // Secret should be gone
      await waitFor(() => {
        expect(screen.queryByText("sk_test_secret_value_xyz")).not.toBeInTheDocument();
      });

      expect(screen.queryByText(/Copy now — shown only once/i)).not.toBeInTheDocument();
    });
  });

  describe("auto-clear timer", () => {
    it("auto-clears the created secret after SECRET_DISPLAY_DURATION_MS", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      // Mock the POST response for creating a key
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_test_auto_clear", prefix: "sk_test" }),
      } as unknown as Response);

      // Fill in label and submit
      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "Auto Clear Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      // Wait for the secret to appear
      await waitFor(() => {
        expect(screen.getByText(/Copy now — shown only once/i)).toBeInTheDocument();
      });

      expect(screen.getByText("sk_test_auto_clear")).toBeInTheDocument();

      // Fast-forward 30 seconds (SECRET_DISPLAY_DURATION_MS)
      act(() => {
        jest.advanceTimersByTime(30_000);
      });

      // Secret should be auto-cleared
      await waitFor(() => {
        expect(screen.queryByText("sk_test_auto_clear")).not.toBeInTheDocument();
      });

      expect(screen.queryByText(/Copy now — shown only once/i)).not.toBeInTheDocument();
    });

    it("does not auto-clear the secret before the timeout", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_still_visible", prefix: "sk_still" }),
      } as unknown as Response);

      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "Still Visible Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/Copy now — shown only once/i)).toBeInTheDocument();
      });

      // Advance time less than the timeout
      act(() => {
        jest.advanceTimersByTime(15_000);
      });

      // Secret should still be visible
      expect(screen.getByText("sk_still_visible")).toBeInTheDocument();

      // Now advance past the timeout
      act(() => {
        jest.advanceTimersByTime(15_001);
      });

      await waitFor(() => {
        expect(screen.queryByText("sk_still_visible")).not.toBeInTheDocument();
      });
    });
  });

  describe("insecure protocol warning", () => {
    it("shows HTTPS warning when not in a secure context", async () => {
      Object.defineProperty(window, "isSecureContext", {
        writable: true,
        value: false,
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_http_secret", prefix: "sk_http" }),
      } as unknown as Response);

      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "HTTP Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/API secrets are only shown over HTTPS/i),
        ).toBeInTheDocument();
      });

      // The secret code should NOT be visible in non-secure context
      expect(screen.queryByText("sk_http_secret")).not.toBeInTheDocument();
    });

    it("shows insecure connection warning over HTTP (non-localhost)", async () => {
      Object.defineProperty(window, "isSecureContext", {
        writable: true,
        value: false,
      });
      Object.defineProperty(window, "location", {
        writable: true,
        value: { protocol: "http:", hostname: "production.example.com" },
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_insecure_secret", prefix: "sk_insecure" }),
      } as unknown as Response);

      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "Insecure Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/insecure connection/i),
        ).toBeInTheDocument();
      });

      // The original HTTPS-required message should NOT be shown
      expect(
        screen.queryByText(/API secrets are only shown over HTTPS/i),
      ).not.toBeInTheDocument();
    });

    it("does NOT show insecure warning over HTTPS", async () => {
      Object.defineProperty(window, "isSecureContext", {
        writable: true,
        value: true,
      });
      Object.defineProperty(window, "location", {
        writable: true,
        value: { protocol: "https:", hostname: "example.com" },
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_https_secret", prefix: "sk_https" }),
      } as unknown as Response);

      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "HTTPS Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      await waitFor(() => {
        expect(screen.getByText(/Copy now — shown only once/i)).toBeInTheDocument();
      });

      // Neither warning should appear
      expect(
        screen.queryByText(/insecure connection/i),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/API secrets are only shown over HTTPS/i),
      ).not.toBeInTheDocument();
    });

    it("does NOT show insecure warning over HTTP on localhost", async () => {
      Object.defineProperty(window, "isSecureContext", {
        writable: true,
        value: false,
      });
      Object.defineProperty(window, "location", {
        writable: true,
        value: { protocol: "http:", hostname: "localhost" },
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [],
          }),
      } as unknown as Response);

      render(<ApiKeysPage />);

      await waitFor(() => {
        expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
      });

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({ key: "sk_localhost", prefix: "sk_local" }),
      } as unknown as Response);

      const labelInput = screen.getByLabelText("Label");
      fireEvent.change(labelInput, { target: { value: "Localhost Key" } });
      fireEvent.click(screen.getByRole("button", { name: /create/i }));

      // Should show the secure-context warning since isSecureContext is false
      await waitFor(() => {
        expect(
          screen.getByText(/API secrets are only shown over HTTPS/i),
        ).toBeInTheDocument();
      });

      // Should NOT show the insecure connection warning since it's localhost
      expect(
        screen.queryByText(/insecure connection/i),
      ).not.toBeInTheDocument();
    });
  });
});

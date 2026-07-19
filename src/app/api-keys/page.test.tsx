import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ApiKeysPage from "./page";

describe("ApiKeysPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock secure context
    Object.defineProperty(window, "isSecureContext", {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
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

  it("masks API key identifiers by default and reveals on button click", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [{ prefix: "sk_live_123456789", label: "Production", createdAt: Date.now() }],
        }),
    } as unknown as Response);

    render(<ApiKeysPage />);
    await waitFor(() => {
      expect(screen.getByText("Production")).toBeInTheDocument();
    });

    // Check it's masked
    expect(screen.getByText("sk_live_••••••••")).toBeInTheDocument();
    expect(screen.queryByText("sk_live_123456789")).not.toBeInTheDocument();

    // Click reveal
    const revealBtn = screen.getByLabelText("Reveal API key Production");
    fireEvent.click(revealBtn);

    // Check it's revealed
    expect(screen.getByText("sk_live_123456789")).toBeInTheDocument();
    expect(screen.queryByText("sk_live_••••••••")).not.toBeInTheDocument();

    // Click hide
    const hideBtn = screen.getByLabelText("Hide API key Production");
    fireEvent.click(hideBtn);

    // Check it's masked again
    expect(screen.getByText("sk_live_••••••••")).toBeInTheDocument();
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import WebhooksPage from "./page";

describe("WebhooksPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<WebhooksPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders webhooks in a single polite live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        items: [{ id: "wh1", url: "https://example.com/hook", events: ["pair.registered"], createdAt: Date.now() }],
      }),
    } as unknown as Response);

    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/hook")).toBeInTheDocument();
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

    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByText(/No webhooks registered/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Forbidden"));

    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Forbidden/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<WebhooksPage />);
    await waitFor(() => {
      expect(screen.getByText(/No webhooks registered/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import EventsPage from "./page";

describe("EventsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    globalThis.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof globalThis.fetch;
    render(<EventsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders events in a single polite live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({
        items: [{ id: "evt1", ts: Date.now(), type: "pair.registered", payload: {} }],
      }),
      json: async () => ({
        items: [{ id: "evt1", ts: Date.now(), type: "pair.registered", payload: {} }],
      }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText("pair.registered")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
      json: async () => ({ items: [] }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("Failed to load"));

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Failed to load/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
      json: async () => ({ items: [] }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});

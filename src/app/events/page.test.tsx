import { render, screen, waitFor } from "@testing-library/react";
import EventsPage from "./page";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

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
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      jsonResponse({
        items: [{ id: "evt1", ts: Date.now(), type: "pair.registered", payload: {} }],
      })
    );

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText("pair.registered")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse({ items: [] }));

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
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse({ items: [] }));

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});

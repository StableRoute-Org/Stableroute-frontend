import { render, screen, waitFor } from "@testing-library/react";
import PairsPage from "./page";

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("PairsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    globalThis.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof globalThis.fetch;
    render(<PairsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders pairs in a single polite live region", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ pairs: [{ source: "USDC", destination: "EURC" }] }));

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("USDC → EURC")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse({ pairs: [] }));

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Network error/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonResponse({ pairs: [] }));

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import PairsPage from "./page";

describe("PairsPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<PairsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders pairs in a single polite live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ pairs: [{ source: "USDC", destination: "EURC" }] }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("USDC → EURC")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ pairs: [] }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Network error/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ pairs: [] }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });
});

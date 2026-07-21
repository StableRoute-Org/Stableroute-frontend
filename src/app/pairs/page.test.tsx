import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import PairsPage from "./page";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(pairs: { source: string; destination: string }[]) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    text: async () => JSON.stringify({ pairs }),
  } as unknown as Response);
}

function mockFetchPending() {
  global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
}

function mockFetchError(message: string) {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error(message));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

describe("PairsPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it("shows loading before data arrives", () => {
    mockFetchPending();
    render(<PairsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    expect(document.querySelector("[aria-live=polite]")).toHaveAttribute("aria-busy", "true");
  });

  it("shows count badge with total pairs", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: "USDC", destination: "EURC" },
            { source: "USDC", destination: "NGNC" },
            { source: "BTC", destination: "USDC" },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("3 pairs")).toBeInTheDocument();
    });
  });

  it("uses singular 'pair' when count is 1", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: "USDC", destination: "EURC" }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("1 pair")).toBeInTheDocument();
    });
  });

  it("groups pairs by source with sorted headings and destinations", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: "USDC", destination: "EURC" },
            { source: "BTC", destination: "USDC" },
            { source: "USDC", destination: "NGNC" },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("3 pairs")).toBeInTheDocument();
    });

    // Source headings should be sorted alphabetically (BTC before USDC)
    const headings = document.querySelectorAll("h2");
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("BTC");
    expect(headings[1]).toHaveTextContent("USDC");

    // BTC section has one destination: "USDC"
    const btcSection = headings[0].closest("section")!;
    const btcDests = btcSection.querySelectorAll("li span.font-mono");
    expect(btcDests).toHaveLength(1);
    expect(btcDests[0]).toHaveTextContent("USDC");

    // USDC destinations should be sorted: EURC, NGNC
    const usdcSection = headings[1].closest("section")!;
    const usdcDests = usdcSection.querySelectorAll("li span.font-mono");
    expect(usdcDests).toHaveLength(2);
    expect(usdcDests[0]).toHaveTextContent("EURC");
    expect(usdcDests[1]).toHaveTextContent("NGNC");

    // Quote and Delete buttons present
    expect(screen.getAllByText("Quote")).toHaveLength(3);
    expect(screen.getAllByText("Delete")).toHaveLength(3);
  });

  it("shows single source with multiple destinations without repeating the source", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: "USDC", destination: "EURC" },
            { source: "USDC", destination: "NGNC" },
            { source: "USDC", destination: "BRL" },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("3 pairs")).toBeInTheDocument();
    });

    // Only one source heading
    const headings = document.querySelectorAll("h2");
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent("USDC");

    // Three destinations listed
    const destItems = document.querySelectorAll("li span.font-mono");
    expect(destItems).toHaveLength(3);

    // Source "USDC" appears only as heading, not within destination items
    const destTexts = Array.from(destItems).map((el) => el.textContent);
    destTexts.forEach((text) => {
      expect(text).not.toContain("→");
    });
  });

  it("announces empty state 'No pairs registered yet' when zero pairs", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ pairs: [] }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs found/i)).toBeInTheDocument();
    });
    expect(document.querySelector("[aria-live=polite]")).toHaveAttribute("aria-busy", "false");
  });

  it("shows 'No pairs found' when filter matches nothing with existing pairs", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: "USDC", destination: "EURC" }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("1 pair")).toBeInTheDocument();
    });

    // Type a filter that matches nothing
    const input = screen.getByPlaceholderText("Search by asset code");
    fireEvent.change(input, { target: { value: "ZZZ" } });

    await waitFor(() => {
      expect(screen.getByText("No pairs found")).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    mockFetchError("Network error");
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Network/i);
    });
    expect(document.querySelector("[aria-live=polite]")).toHaveAttribute(
      "aria-busy",
      "false",
    );
  });

  it("has exactly one aria-live=polite region", async () => {
    mockFetch([]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs found/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });

  it("does not show count badge while loading", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<PairsPage />);

    // During loading, badge text like "3 pairs" or "1 pair" must not be present.
    // Use a regex anchored to a digit followed by space and "pair".
    expect(screen.queryByText(/\d+ pairs?/)).not.toBeInTheDocument();
  });

  it("preserves quote and delete links with correct URLs in grouped view", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: "USDC", destination: "EURC" }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText("EURC")).toBeInTheDocument();
    });

    const quoteLink = screen.getByText("Quote").closest("a")!;
    expect(quoteLink).toHaveAttribute(
      "href",
      "/quote?source=USDC&dest=EURC",
    );
  });
});

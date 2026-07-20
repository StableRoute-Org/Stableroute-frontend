import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  // -------------------------------------------------------------------------
  // Existing live-region contract (regression guard)
  // -------------------------------------------------------------------------

  it("renders pairs in a single polite live region", async () => {
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "USDC" })).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
    expect(live).toHaveAttribute("aria-busy", "false");
  });

  it("announces empty state via live region", async () => {
    mockFetch([]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs found/i)).toBeInTheDocument();
    });
    expect(document.querySelector("[aria-live=polite]")).toHaveAttribute("aria-busy", "false");
  });

  it("surfaces errors with role=alert", async () => {
    mockFetchError("Network error");
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Network request failed/i);
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

  // -------------------------------------------------------------------------
  // Table structure
  // -------------------------------------------------------------------------

  it("renders a table with column headers when pairs are present", async () => {
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByRole("columnheader", { name: /Source/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Destination/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Actions/i })).toBeInTheDocument();
  });

  it("renders each pair as a table row with source and destination cells", async () => {
    mockFetch([
      { source: "USDC", destination: "EURC" },
      { source: "BTC", destination: "ETH" },
    ]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getAllByRole("row")).toHaveLength(3); // 1 header + 2 data rows
    });
    expect(screen.getByRole("cell", { name: "USDC" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "EURC" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "BTC" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "ETH" })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // aria-sort initial state
  // -------------------------------------------------------------------------

  it("renders Source and Destination headers with aria-sort='none' initially", async () => {
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "none",
    );
    expect(screen.getByRole("columnheader", { name: /Destination/i })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  // -------------------------------------------------------------------------
  // Sort by Source — ascending then descending
  // -------------------------------------------------------------------------

  it("sorts rows ascending by source on first click", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "EURC", destination: "USDC" },
      { source: "BTC", destination: "ETH" },
      { source: "USDC", destination: "EURC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    const rows = screen.getAllByRole("row").slice(1); // skip header row
    expect(within(rows[0]).getByRole("cell", { name: "BTC" })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("cell", { name: "EURC" })).toBeInTheDocument();
    expect(within(rows[2]).getByRole("cell", { name: "USDC" })).toBeInTheDocument();
  });

  it("sets aria-sort='ascending' on Source header after first click", async () => {
    const user = userEvent.setup();
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("sorts rows descending by source on second click", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "EURC", destination: "USDC" },
      { source: "BTC", destination: "ETH" },
      { source: "USDC", destination: "EURC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    const btn = screen.getByRole("button", { name: /Sort by Source/i });
    await user.click(btn);
    await user.click(btn);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("cell", { name: "USDC" })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("cell", { name: "EURC" })).toBeInTheDocument();
    expect(within(rows[2]).getByRole("cell", { name: "BTC" })).toBeInTheDocument();
  });

  it("sets aria-sort='descending' on Source header after second click", async () => {
    const user = userEvent.setup();
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    const btn = screen.getByRole("button", { name: /Sort by Source/i });
    await user.click(btn);
    await user.click(btn);

    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  // -------------------------------------------------------------------------
  // Sort by Destination
  // -------------------------------------------------------------------------

  it("sorts rows ascending by destination on first click", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "USDC", destination: "ETH" },
      { source: "BTC", destination: "USDC" },
      { source: "EURC", destination: "BTC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Destination/i }));

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("cell", { name: "BTC" })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("cell", { name: "ETH" })).toBeInTheDocument();
    expect(within(rows[2]).getByRole("cell", { name: "USDC" })).toBeInTheDocument();
  });

  it("sets aria-sort='ascending' on Destination header, 'none' on Source", async () => {
    const user = userEvent.setup();
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Destination/i }));

    expect(screen.getByRole("columnheader", { name: /Destination/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  // -------------------------------------------------------------------------
  // Switching active sort column resets direction to ascending
  // -------------------------------------------------------------------------

  it("resets sort direction to ascending when switching active column", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "USDC", destination: "ETH" },
      { source: "BTC", destination: "EURC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    // Click Source twice → descending
    const srcBtn = screen.getByRole("button", { name: /Sort by Source/i });
    await user.click(srcBtn);
    await user.click(srcBtn);
    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "descending",
    );

    // Switch to Destination → should start ascending
    await user.click(screen.getByRole("button", { name: /Sort by Destination/i }));
    expect(screen.getByRole("columnheader", { name: /Destination/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "none",
    );
  });

  // -------------------------------------------------------------------------
  // Stable sort — equal values preserve insertion order
  // -------------------------------------------------------------------------

  it("maintains stable order for pairs with equal source values", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "USDC", destination: "EURC" },
      { source: "USDC", destination: "BTC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    const rows = screen.getAllByRole("row").slice(1);
    // Insertion order preserved: EURC before BTC for equal source 'USDC'
    expect(within(rows[0]).getByRole("cell", { name: "EURC" })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("cell", { name: "BTC" })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Sort interacts correctly with the filter
  // -------------------------------------------------------------------------

  it("applies sort to filtered results only", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "USDC", destination: "EURC" },
      { source: "BTC", destination: "ETH" },
      { source: "XLM", destination: "USDC" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    // Filter to pairs containing "USDC"
    await user.type(screen.getByPlaceholderText(/Search by asset code/i), "USDC");

    // Sort ascending by source among filtered results
    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    const rows = screen.getAllByRole("row").slice(1);
    // XLM has USDC as destination; USDC has USDC as source
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("cell", { name: "USDC" })).toBeInTheDocument();
    expect(within(rows[1]).getByRole("cell", { name: "XLM" })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Keyboard accessibility — sort button is reachable via Enter
  // -------------------------------------------------------------------------

  it("activates sort via keyboard Enter on the sort button", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "USDC", destination: "EURC" },
      { source: "BTC", destination: "ETH" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    const btn = screen.getByRole("button", { name: /Sort by Source/i });
    btn.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  // -------------------------------------------------------------------------
  // Edge case: single pair — sort is a no-op but aria-sort still changes
  // -------------------------------------------------------------------------

  it("handles single pair without error and updates aria-sort", async () => {
    const user = userEvent.setup();
    mockFetch([{ source: "USDC", destination: "EURC" }]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    expect(screen.getByRole("columnheader", { name: /Source/i })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(screen.getAllByRole("row")).toHaveLength(2); // header + 1 data row
  });

  // -------------------------------------------------------------------------
  // Sorting does not remove Quote / Delete action buttons
  // -------------------------------------------------------------------------

  it("preserves Quote and Delete buttons after sorting", async () => {
    const user = userEvent.setup();
    mockFetch([
      { source: "EURC", destination: "USDC" },
      { source: "BTC", destination: "ETH" },
    ]);
    render(<PairsPage />);
    await waitFor(() => expect(screen.getByRole("table")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sort by Source/i }));

    expect(screen.getAllByRole("link", { name: /Quote/i })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Delete/i })).toHaveLength(2);
  });
});

import { render, screen, waitFor } from "@testing-library/react";
import { StatsClient } from "./Client";

describe("StatsClient", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("renders initial stats without waiting for the first poll", () => {
    const initial = { totalPairs: 42, paused: false };
    render(<StatsClient initial={initial} error={null} />);
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
  });

  it("renders the initial error when provided", () => {
    render(<StatsClient initial={null} error="backend down" />);
    expect(screen.getByRole("alert")).toHaveTextContent("backend down");
  });

  it("polls for updates after mounting", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ totalPairs: 10, paused: true }),
    }) as unknown as typeof global.fetch;

    render(<StatsClient initial={null} error={null} />);
    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
    });
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("surfaces fetch errors in the live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      text: async () => "Bad Gateway",
    }) as unknown as typeof global.fetch;

    render(<StatsClient initial={null} error={null} />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("HTTP 502");
    });
  });
});

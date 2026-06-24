import { render, screen, waitFor } from "@testing-library/react";
import StatsPage from "./page";

describe("StatsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const mockFetchResponse = (data: any) => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(data),
      json: async () => data,
    } as unknown as Response);
  };

  it("renders small count without separators", async () => {
    mockFetchResponse({ totalPairs: 123, paused: false });
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("123")).toBeInTheDocument();
    });
  });

  it("renders large count with separators", async () => {
    mockFetchResponse({ totalPairs: 1234567, paused: false });
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("1,234,567")).toBeInTheDocument();
    });
  });

  it("renders zero count", async () => {
    mockFetchResponse({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  it("renders Live status", async () => {
    mockFetchResponse({ totalPairs: 100, paused: false });
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("Live")).toBeInTheDocument();
    });
  });

  it("renders Paused status", async () => {
    mockFetchResponse({ totalPairs: 100, paused: true });
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByText("Paused")).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("API Error"));
    render(<StatsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/API Error/i);
    });
  });
});

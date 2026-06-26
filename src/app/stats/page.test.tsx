import { render, screen, waitFor } from "@testing-library/react";
import StatsPage from "./page";

const mockFetch = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("StatsPage", () => {
  it("renders the heading", () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    expect(screen.getByRole("heading", { name: /stats/i })).toBeInTheDocument();
  });

  it("formats totalPairs with thousands separators via formatNumber", async () => {
    mockFetch({ totalPairs: 1234567, paused: false });
    render(<StatsPage />);
    const pairs = await screen.findByText("1,234,567");
    expect(pairs).toBeInTheDocument();
  });

  it("renders Live when paused is false", async () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    const status = await screen.findByText("Live");
    expect(status).toBeInTheDocument();
  });

  it("renders Paused when paused is true", async () => {
    mockFetch({ totalPairs: 0, paused: true });
    render(<StatsPage />);
    const status = await screen.findByText("Paused");
    expect(status).toBeInTheDocument();
  });

  it("renders error message on fetch failure", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
    render(<StatsPage />);
    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/network error/i);
    });
  });
});

import { act, render, screen, waitFor } from "@testing-library/react";
import StatsPage from "./page";

const mockFetch = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify(data)),
  } as unknown as Response);
};

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("StatsPage", () => {
  it("renders the heading", async () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);
    expect(screen.getByRole("heading", { name: /stats/i })).toBeInTheDocument();
    await screen.findByText("Live");
  });

  it("renders one canonical stats page region and heading", async () => {
    mockFetch({ totalPairs: 0, paused: false });
    render(<StatsPage />);

    expect(screen.getAllByRole("heading", { name: /stats/i })).toHaveLength(1);
    expect(document.querySelectorAll("#main-content")).toHaveLength(1);
    await screen.findByText("Live");
  });

  it("names the metrics panel with an accessible region", async () => {
    mockFetch({ totalPairs: 12, paused: false });
    render(<StatsPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /router metrics/i }),
      ).toBeInTheDocument();
    });
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

  it("keeps the existing 5 second polling update behavior", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ totalPairs: 1, paused: false })),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ totalPairs: 2000, paused: true })),
      } as unknown as Response);

    render(<StatsPage />);

    expect(await screen.findByText("1")).toBeInTheDocument();
    expect(await screen.findByText("Live")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByText("2,000")).toBeInTheDocument();
    expect(await screen.findByText("Paused")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("clears the polling interval on unmount", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ totalPairs: 42, paused: false })),
    } as unknown as Response);

    const { unmount } = render(<StatsPage />);
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

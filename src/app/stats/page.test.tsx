import { act, render, screen, waitFor } from "@testing-library/react";
import { apiGet } from "../../lib/apiClient";
import StatsPage from "./page";

jest.mock("../../lib/apiClient", () => ({
  apiGet: jest.fn(),
}));

type Stats = { totalPairs: number; paused: boolean };

const mockApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

const mockStats = (totalPairs: number, paused: boolean): Stats => ({
  totalPairs,
  paused,
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  mockApiGet.mockReset();
});

describe("StatsPage", () => {
  it("fetches stats immediately on mount and renders formatted pair totals", async () => {
    mockApiGet.mockResolvedValue(mockStats(1234567, false));

    render(<StatsPage />);

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    expect(mockApiGet).toHaveBeenCalledWith("/api/v1/stats");
    expect(screen.getByRole("heading", { name: /stats/i })).toBeInTheDocument();
    expect(await screen.findByText("1,234,567")).toBeInTheDocument();
  });

  it("renders Live when paused is false", async () => {
    mockApiGet.mockResolvedValue(mockStats(0, false));

    render(<StatsPage />);

    expect(await screen.findByText("Live")).toBeInTheDocument();
  });

  it("renders Paused when paused is true", async () => {
    mockApiGet.mockResolvedValue(mockStats(0, true));

    render(<StatsPage />);

    expect(await screen.findByText("Paused")).toBeInTheDocument();
  });

  it("polls again after five seconds and renders the updated stats", async () => {
    jest.useFakeTimers();
    mockApiGet
      .mockResolvedValueOnce(mockStats(12, false))
      .mockResolvedValueOnce(mockStats(99, true));

    render(<StatsPage />);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();

    // The page polls on a fixed 5s interval; advancing time should trigger the
    // second API read and let the UI reflect the latest response.
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("99")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
  });

  it("renders error message on fetch failure", async () => {
    mockApiGet.mockRejectedValue(new Error("Network error"));

    render(<StatsPage />);

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toHaveTextContent(/network error/i);
    });
  });

  it("clears the polling interval when unmounted", async () => {
    jest.useFakeTimers();
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    mockApiGet.mockResolvedValue(mockStats(42, false));

    const { unmount } = render(<StatsPage />);

    expect(await screen.findByText("42")).toBeInTheDocument();
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });

  it("ignores an in-flight stats request after unmount", async () => {
    jest.useFakeTimers();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    let resolveStats: (stats: Stats) => void = () => {};
    mockApiGet.mockReturnValue(
      new Promise<Stats>((resolve) => {
        resolveStats = resolve;
      })
    );

    const { unmount } = render(<StatsPage />);

    unmount();
    await act(async () => {
      resolveStats(mockStats(77, false));
    });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});

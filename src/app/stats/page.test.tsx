import { act, fireEvent, render, screen } from "@testing-library/react";
import StatsPage from "./page";

type Stats = { totalPairs: number; paused: boolean };

function statsResponse(stats: Stats) {
  return {
    ok: true,
    status: 200,
    json: async () => stats,
  } as unknown as Response;
}

function setVisibility(value: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value,
  });
}

describe("StatsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    jest.useFakeTimers();
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    setVisibility("visible");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (document as { visibilityState?: DocumentVisibilityState }).visibilityState;
  });

  it("renders stats with StatTile tiles and a last-updated timestamp", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      statsResponse({ totalPairs: 2, paused: false })
    ) as unknown as typeof globalThis.fetch;

    render(<StatsPage />);

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/)).toHaveTextContent("just now");
  });

  it("pauses interval polling while the tab is hidden", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce(
      statsResponse({ totalPairs: 2, paused: false })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    expect(await screen.findByText("2")).toBeInTheDocument();

    setVisibility("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("resumes with an immediate fetch when the tab becomes visible", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(statsResponse({ totalPairs: 2, paused: false }))
      .mockResolvedValueOnce(statsResponse({ totalPairs: 5, paused: true }));
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    expect(await screen.findByText("2")).toBeInTheDocument();

    setVisibility("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    setVisibility("visible");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.getByText("Paused")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("keeps the last good stats and stops polling after an error", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(statsResponse({ totalPairs: 2, paused: false }))
      .mockRejectedValueOnce(new Error("stats unavailable"));
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    expect(await screen.findByText("2")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("stats unavailable");
    expect(screen.getByText("2")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("refreshes manually and resumes polling after a successful refresh", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(statsResponse({ totalPairs: 2, paused: false }))
      .mockResolvedValueOnce(statsResponse({ totalPairs: 6, paused: false }))
      .mockResolvedValueOnce(statsResponse({ totalPairs: 7, paused: false }));
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<StatsPage />);
    expect(await screen.findByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Refresh/i }));
    expect(await screen.findByText("6")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(await screen.findByText("7")).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("cleans up listeners and intervals on unmount", async () => {
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval");
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      statsResponse({ totalPairs: 2, paused: false })
    ) as unknown as typeof globalThis.fetch;

    const { unmount } = render(<StatsPage />);
    expect(await screen.findByText("2")).toBeInTheDocument();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function)
    );
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});

import { render, screen, fireEvent, act } from "@testing-library/react";
import { ConnectionBanner } from "../ConnectionBanner";

// Capture handler registered by the component so tests can simulate events.
let capturedHandler: { onError: () => void; onSuccess: () => void } | null = null;

jest.mock("@/lib/apiClient", () => ({
  registerConnectionHandler: jest.fn(
    (handler: { onError: () => void; onSuccess: () => void }) => {
      capturedHandler = handler;
      return () => {
        capturedHandler = null;
      };
    },
  ),
}));

// Helpers to manipulate navigator.onLine and dispatch online/offline events
function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    writable: true,
    configurable: true,
  });
  act(() => {
    window.dispatchEvent(new Event(value ? "online" : "offline"));
  });
}

describe("ConnectionBanner", () => {
  beforeEach(() => {
    capturedHandler = null;
    jest.clearAllMocks();
    // Default: online
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  it("does not render when online and no failures have occurred", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders immediately when navigator.onLine is false on mount", () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      writable: true,
      configurable: true,
    });
    render(<ConnectionBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText(/the api is unreachable/i),
    ).toBeInTheDocument();
  });

  it("shows the banner after the offline event fires", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    setOnline(false);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("shows the banner after two consecutive API connection errors", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // First failure – not enough to show the banner
    act(() => {
      capturedHandler!.onError();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Second failure – threshold reached
    act(() => {
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("clears the banner when a successful request fires after failures", () => {
    render(<ConnectionBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Trigger enough failures to show the banner
    act(() => {
      capturedHandler!.onError();
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // A successful request clears it
    act(() => {
      capturedHandler!.onSuccess();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("resets the consecutive failure counter on success", () => {
    render(<ConnectionBanner />);

    // Two failures → banner shown
    act(() => {
      capturedHandler!.onError();
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Success resets counter
    act(() => {
      capturedHandler!.onSuccess();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // One failure after reset should NOT show banner
    act(() => {
      capturedHandler!.onError();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Second failure shows it again
    act(() => {
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("allows the user to dismiss the banner", () => {
    render(<ConnectionBanner />);

    // Show banner via offline event
    setOnline(false);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /dismiss connectivity warning/i }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("re-shows the banner on a new error after user dismiss", () => {
    render(<ConnectionBanner />);

    // Show via failures
    act(() => {
      capturedHandler!.onError();
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();

    // Dismiss
    fireEvent.click(
      screen.getByRole("button", { name: /dismiss connectivity warning/i }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // New error re-shows (counter already >= 2, next increment triggers)
    act(() => {
      capturedHandler!.onError();
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("keeps the banner hidden after dismiss if no new errors occur", () => {
    render(<ConnectionBanner />);

    setOnline(false);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /dismiss connectivity warning/i }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    // Still hidden – no new trigger occurred
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears the banner on success even when shown due to offline state", () => {
    setOnline(false);
    render(<ConnectionBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      capturedHandler!.onSuccess();
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("unregisters the connection handler on unmount", () => {
    const { unmount } = render(<ConnectionBanner />);
    expect(capturedHandler).not.toBeNull();

    unmount();
    expect(capturedHandler).toBeNull();
  });

  it("removes the offline event listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
    const { unmount } = render(<ConnectionBanner />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "offline",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});

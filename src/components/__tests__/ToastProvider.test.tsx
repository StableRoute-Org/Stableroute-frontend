import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

function ToastHarness() {
  const { push } = useToast();

  return (
    <div>
      <button onClick={() => push("Saved route")}>Show info</button>
      <button onClick={() => push("Route failed", "error")}>
        Show error
      </button>
      <button
        onClick={() => {
          push("First route");
          push("Second route");
        }}
      >
        Show two
      </button>
    </div>
  );
}

function MissingProviderHarness() {
  useToast();
  return null;
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("renders info toasts as polite status messages", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show info" }));

    expect(screen.getByRole("status")).toHaveTextContent("Saved route");
    expect(screen.getByText("Saved route").parentElement).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("renders error toasts with an alert role", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show error" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Route failed");
  });

  it("auto-dismisses toasts after four seconds", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show info" }));
    expect(screen.getByText("Saved route")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(screen.queryByText("Saved route")).not.toBeInTheDocument();
  });

  it("keeps multiple queued toasts visible until their timers expire", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Show two" }));

    expect(screen.getByText("First route")).toBeInTheDocument();
    expect(screen.getByText("Second route")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3999);
    });

    expect(screen.getByText("First route")).toBeInTheDocument();
    expect(screen.getByText("Second route")).toBeInTheDocument();
  });

  it("throws a clear error when useToast is rendered outside the provider", () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(() => render(<MissingProviderHarness />)).toThrow(
      "useToast must be used inside <ToastProvider>",
    );

    consoleError.mockRestore();
  });
});

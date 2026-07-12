import { render, screen, act, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

function ToastHarness() {
  const { push } = useToast();
  return (
    <div>
      <button type="button" onClick={() => push("hello")}>
        push-default
      </button>
      <button
        type="button"
        onClick={() => push("slow", "info", { durationMs: 8000 })}
      >
        push-slow
      </button>
      <button type="button" onClick={() => push("sticky error", "error", { sticky: true })}>
        push-sticky
      </button>
    </div>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("auto-dismisses toasts after the default duration", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "push-default" }));
    expect(screen.getByText("hello")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3999);
    });
    expect(screen.getByText("hello")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });

  it("honours a custom durationMs", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "push-slow" }));
    act(() => {
      jest.advanceTimersByTime(7999);
    });
    expect(screen.getByText("slow")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText("slow")).not.toBeInTheDocument();
  });

  it("keeps sticky toasts until manually dismissed", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "push-sticky" }));
    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByRole("alert")).toHaveTextContent("sticky error");

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("sticky error")).not.toBeInTheDocument();
  });

  it("clears pending timers when a toast is dismissed early", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "push-default" }));
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("hello")).not.toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10_000);
    });
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });

  it("renders multiple toasts independently", () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "push-default" }));
    fireEvent.click(screen.getByRole("button", { name: "push-sticky" }));
    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(screen.getByText("sticky error")).toBeInTheDocument();
  });
});

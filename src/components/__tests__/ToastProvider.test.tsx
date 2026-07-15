import { act, fireEvent, render, screen } from "@testing-library/react";
import { ToastProvider, useToast } from "../ToastProvider";

function ToastHarness() {
  const { push } = useToast();
  return (
    <div>
      <button type="button" onClick={() => push("Alpha")}>
        Alpha
      </button>
      <button type="button" onClick={() => push("Beta")}>
        Beta
      </button>
      <button type="button" onClick={() => push("Gamma")}>
        Gamma
      </button>
      <button type="button" onClick={() => push("Delta")}>
        Delta
      </button>
      <button type="button" onClick={() => push("Alpha", "error")}>
        Alpha error
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <ToastProvider>
      <ToastHarness />
    </ToastProvider>
  );
}

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("renders status and alert roles for info and error toasts", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha error" }));

    expect(screen.getByRole("status")).toHaveTextContent("Alpha");
    expect(screen.getByRole("alert")).toHaveTextContent("Alpha");
  });

  it("caps visible toasts and drops the oldest item", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    fireEvent.click(screen.getByRole("button", { name: "Gamma" }));
    fireEvent.click(screen.getByRole("button", { name: "Delta" }));

    const toasts = screen.getAllByRole("status");
    expect(toasts).toHaveLength(3);
    expect(toasts[0]).toHaveTextContent("Beta");
    expect(toasts[1]).toHaveTextContent("Gamma");
    expect(toasts[2]).toHaveTextContent("Delta");
    expect(toasts.some((toast) => toast.textContent?.includes("Alpha"))).toBe(false);
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it("collapses duplicate messages with the same level into one toast", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Alpha");
    expect(screen.getByText("x2")).toBeInTheDocument();
    expect(screen.getByLabelText("2 duplicate notifications")).toBeInTheDocument();
  });

  it("keeps matching messages with different levels separate", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha error" }));

    expect(screen.getByRole("status")).toHaveTextContent("Alpha");
    expect(screen.getByRole("alert")).toHaveTextContent("Alpha");
    expect(screen.queryByText("x2")).not.toBeInTheDocument();
  });

  it("refreshes the auto-dismiss timer when a duplicate is collapsed", () => {
    renderHarness();

    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Alpha");

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ErrorBoundary from "./error";

const originalNodeEnv = process.env.NODE_ENV;
let consoleError: jest.SpyInstance;

const setNodeEnv = (value: string) => {
  Object.defineProperty(process.env, "NODE_ENV", {
    configurable: true,
    value,
  });
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setNodeEnv(originalNodeEnv);
  });

  it("renders a safe message without backend-assigned error fields", () => {
    const error = Object.assign(new Error("backend request failed"), {
      digest: "digest-123",
      requestId: "req-sensitive",
    });

    render(<ErrorBoundary error={error} reset={jest.fn()} />);

    expect(screen.getByRole("heading", { name: "Something went wrong." })).toBeInTheDocument();
    expect(
      screen.getByText("We could not complete that action. Please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/backend request failed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/req-sensitive/i)).not.toBeInTheDocument();
  });

  it("keeps the main content focus target available", () => {
    const { container } = render(<ErrorBoundary error={new Error("")} reset={jest.fn()} />);

    const main = container.querySelector("#main-content");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("tabindex", "-1");
    expect(main).toHaveClass("focus:outline-none");
  });

  it("calls reset when the retry button is clicked", () => {
    const reset = jest.fn();
    render(<ErrorBoundary error={new Error("failed")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs only a minimal summary outside production", async () => {
    setNodeEnv("test");
    const error = Object.assign(new Error("backend request failed"), {
      digest: "digest-123",
      requestId: "req-sensitive",
    });

    render(<ErrorBoundary error={error} reset={jest.fn()} />);

    await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
    expect(consoleError).toHaveBeenCalledWith("App error boundary caught:", {
      message: "backend request failed",
      digest: "digest-123",
    });
  });

  it("does not log error details in production", async () => {
    setNodeEnv("production");

    render(<ErrorBoundary error={new Error("backend request failed")} reset={jest.fn()} />);

    await waitFor(() => expect(consoleError).not.toHaveBeenCalled());
  });
});

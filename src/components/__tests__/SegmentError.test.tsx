import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentError } from "../SegmentError";

describe("SegmentError", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("names the segment in the heading", () => {
    render(<SegmentError segment="quote" error={new Error("boom")} reset={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /The quote page hit an error\./i }),
    ).toBeInTheDocument();
  });

  it("announces the error message via role=alert", () => {
    render(<SegmentError segment="events" error={new Error("backend down")} reset={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("backend down");
  });

  it("falls back to a generic message when the error message is empty", () => {
    render(<SegmentError segment="quote" error={new Error("")} reset={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unexpected error.");
  });

  it("shows the request id when the error carries one", () => {
    const error = Object.assign(new Error("boom"), { requestId: "req-42" });
    render(<SegmentError segment="quote" error={error} reset={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Request ID: req-42/);
  });

  it("omits the request id line when the error has none", () => {
    render(<SegmentError segment="quote" error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByRole("alert")).not.toHaveTextContent(/Request ID/);
  });

  it("invokes reset exactly once when Try again is clicked", () => {
    const reset = jest.fn();
    render(<SegmentError segment="quote" error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the digest when the error carries one", () => {
    const error = Object.assign(new Error("boom"), { digest: "digest-123" });
    render(<SegmentError segment="events" error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      "events segment error boundary caught:",
      "digest-123",
    );
  });

  it("logs the message when the error has no digest", () => {
    render(<SegmentError segment="quote" error={new Error("boom")} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith("quote segment error boundary caught:", "boom");
  });

  it("keeps the main-content skip-link target so focus management still works", () => {
    render(<SegmentError segment="quote" error={new Error("boom")} reset={() => {}} />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabindex", "-1");
  });
});

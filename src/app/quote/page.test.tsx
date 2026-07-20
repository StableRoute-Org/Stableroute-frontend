import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Component, type ReactNode } from "react";
import QuotePage from "./page";
import QuoteError from "./error";
import { Header } from "@/components/Header";

describe("QuotePage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders the heading and form fields", () => {
    render(<QuotePage />);
    expect(screen.getByRole("heading", { name: /Get a quote/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Source asset/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination asset/i, { selector: "input" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
  });

  it("calls the backend and renders the route on success", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "1000000",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "1000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/USDC → EURC/);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("source_asset=USDC&dest_asset=EURC&amount=1000000"),
      expect.anything(),
    );
  });

  it("formats quote amount and rate while preserving raw values in title", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "10000000",
        estimated_rate: "1234",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "10000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/1\.00 XLM/);
    });
    expect(screen.getByText("1.00 XLM")).toHaveAttribute("title", "10000000");
    expect(screen.getByText("1,234")).toHaveAttribute("title", "1234");
  });

  it("blocks submission when source == destination", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "1" },
    });
    const form = screen.getByLabelText(/Amount/i).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/must differ/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when amount is not a positive integer", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "1.5" },
    });
    const form = screen.getByLabelText(/Amount/i).closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/positive integer/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when an asset code contains unsafe characters", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "US$C" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.submit(screen.getByLabelText(/Amount/i).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/1-12 letters or numbers/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when an asset code is over length", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "TOO-LONG-ASSET" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.submit(screen.getByLabelText(/Amount/i).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/1-12 letters or numbers/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when asset codes are whitespace-only", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.submit(screen.getByLabelText(/Amount/i).closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/1-12 letters or numbers/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("trims valid asset codes and amount before issuing the request", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "100",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: " USDC " },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: " EURC " },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: " 100 " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/USDC → EURC/);
    });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("source_asset=USDC&dest_asset=EURC&amount=100"),
      expect.anything(),
    );
  });

  it("associates validation errors with the relevant TextField inputs", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.submit(screen.getByLabelText(/Amount/i).closest("form")!);

    await waitFor(() => {
      expect(screen.getByLabelText(/Destination asset/i, { selector: "input" })).toHaveAttribute("aria-invalid", "true");
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("surfaces a backend invalid_request as a role=alert", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/must differ/i)).toBeInTheDocument();
    });
  });

  it("shows the requestId when the backend includes one", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
        requestId: "req-abc-123",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/must differ/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(/Request ID: req-abc-123/);
  });

  it("omits the requestId line when the backend does not include one", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i, { selector: "input" }), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i, { selector: "input" }), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/must differ/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).not.toHaveTextContent(/Request ID/);
  });
});

describe("QuoteError segment boundary", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    // jsdom does not implement matchMedia; Header renders ThemeToggle which
    // resolves the effective theme through it on mount.
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  /**
   * Minimal stand-in for the Next.js segment boundary: renders the segment's
   * `error.tsx` default export when a child throws, and re-renders the
   * children when the fallback's `reset()` fires — mirroring App Router
   * semantics.
   */
  class SegmentBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    state: { error: Error | null } = { error: null };

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    render() {
      if (this.state.error) {
        return (
          <QuoteError error={this.state.error} reset={() => this.setState({ error: null })} />
        );
      }
      return this.props.children;
    }
  }

  function CrashingSegment(): ReactNode {
    throw new Error("quote segment exploded");
  }

  it("renders the segment-scoped fallback with the thrown message", () => {
    render(
      <SegmentBoundary>
        <CrashingSegment />
      </SegmentBoundary>,
    );
    expect(
      screen.getByRole("heading", { name: /The quote page hit an error\./i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("quote segment exploded");
  });

  it("keeps the header and navigation mounted during the error state", () => {
    render(
      <>
        <Header />
        <SegmentBoundary>
          <CrashingSegment />
        </SegmentBoundary>
      </>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /main navigation/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("quote segment exploded");
  });

  it("recovers the segment via reset without a full page reload", () => {
    let crash = true;
    function FlakySegment(): ReactNode {
      if (crash) throw new Error("quote segment exploded");
      return <p>quote content</p>;
    }
    render(
      <>
        <Header />
        <SegmentBoundary>
          <FlakySegment />
        </SegmentBoundary>
      </>,
    );
    const headerEl = screen.getByRole("banner");
    expect(screen.queryByText("quote content")).not.toBeInTheDocument();

    crash = false;
    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

    // Same header DOM node after recovery proves the shell never remounted.
    expect(screen.getByText("quote content")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBe(headerEl);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("logs the digest when the thrown error carries one", () => {
    const error = Object.assign(new Error("boom"), { digest: "digest-quote-1" });
    render(<QuoteError error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      "quote segment error boundary caught:",
      "digest-quote-1",
    );
  });
});

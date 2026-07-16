import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QuotePage from "./page";

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
    expect(screen.getByLabelText(/Source asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
  });

  it("calls the backend and renders the route on success", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "1000000",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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
    );
  });

  it("formats quote amount and rate while preserving raw values in title", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "10000000",
        estimated_rate: "1234",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "10000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/1\.00 XLM/);
    });
    expect(screen.getByText(/Amount:/)).toHaveAttribute("title", "10000000");
    expect(screen.getByText(/Estimated rate:/)).toHaveAttribute("title", "1234");
    expect(screen.getByText(/Estimated rate:/)).toHaveTextContent("1,234");
  });

  it("blocks submission when source == destination", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "US$C" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "TOO-LONG-ASSET" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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
      json: async () => ({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "100",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      }),
    } as unknown as Response);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: " USDC " },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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
    );
  });

  it("associates validation errors with the relevant TextField inputs", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.submit(screen.getByLabelText(/Amount/i).closest("form")!);

    await waitFor(() => {
      expect(screen.getByLabelText(/Destination asset/i)).toHaveAttribute("aria-invalid", "true");
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("surfaces a backend invalid_request as a role=alert", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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
      json: async () => ({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
        requestId: "req-abc-123",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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
      json: async () => ({
        error: "invalid_request",
        message: "source_asset and dest_asset must differ",
      }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
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

  it("renders multi-hop routes as distinct badges separated by arrows", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          source_asset: "USDC",
          dest_asset: "BRL",
          amount: "100",
          estimated_rate: "5.0",
          route: ["USDC", "XLM", "BRL"],
        }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText("Destination asset"), {
      target: { value: "BRL" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/USDC/);
    });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/USDC/);
    expect(status).toHaveTextContent(/XLM/);
    expect(status).toHaveTextContent(/BRL/);
    expect(status.textContent ?? "").toMatch(/USDC.*XLM.*BRL/);
    expect(status.querySelectorAll("ol[aria-label='Routing hops'] li")).toHaveLength(3);
  });

  it("labels two-hop routes as Direct route", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce({
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

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText("Destination asset"), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/Direct route/i)).toBeInTheDocument();
    });
  });

  it("copies the route path to the clipboard when the Copy route button is clicked", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    const originalClipboard = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      "clipboard",
    );
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    globalThis.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          source_asset: "USDC",
          dest_asset: "BRL",
          amount: "100",
          estimated_rate: "5.0",
          route: ["USDC", "XLM", "BRL"],
        }),
    } as unknown as Response);

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText("Destination asset"), {
      target: { value: "BRL" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    const copy = await screen.findByRole("button", { name: /Copy route/ });
    fireEvent.click(copy);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("USDC → XLM → BRL");
    });

    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, "clipboard", originalClipboard);
    }
  });

  it("does not throw when clipboard is unavailable", async () => {
    const originalClipboard = Object.getOwnPropertyDescriptor(
      globalThis.navigator,
      "clipboard",
    );
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    globalThis.fetch = jest.fn().mockResolvedValueOnce({
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

    render(<QuotePage />);
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USDC" },
    });
    fireEvent.change(screen.getByLabelText("Destination asset"), {
      target: { value: "EURC" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    const copy = await screen.findByRole("button", { name: /Copy route/i });
    expect(() => fireEvent.click(copy)).not.toThrow();

    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, "clipboard", originalClipboard);
    }
  });
});

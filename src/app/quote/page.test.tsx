import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import QuotePage from "./page";

const getSourceInput = () => screen.getByRole("textbox", { name: /Source asset/i });
const getDestinationInput = () => screen.getByRole("textbox", { name: /Destination asset/i });
const getAmountInput = () => screen.getByRole("textbox", { name: /Amount \(base units\)/i });

describe("QuotePage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it("renders the heading and form fields", () => {
    render(<QuotePage />);
    expect(screen.getByRole("heading", { name: /Get a quote/i })).toBeInTheDocument();
    expect(getSourceInput()).toBeInTheDocument();
    expect(getDestinationInput()).toBeInTheDocument();
    expect(getAmountInput()).toBeInTheDocument();
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
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
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

  it("ignores rapid duplicate submissions while a request is already in flight", async () => {
    jest.useFakeTimers();

    let resolveRequest: ((value: Response) => void) | undefined;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });

    const mockFetch = jest.fn().mockImplementationOnce(() => pendingResponse);
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "1000000" },
    });

    const form = getAmountInput().closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Quoting…/i })).toBeDisabled();

    resolveRequest?.({
      ok: true,
      json: async () => ({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "1000000",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/USDC → EURC/);
    });

  });

  it("aborts an earlier in-flight request before replacing it after the cooldown", async () => {
    jest.useFakeTimers();

    let firstSignal: AbortSignal | undefined;
    let secondSignal: AbortSignal | undefined;

    const mockFetch = jest
      .fn()
      .mockImplementationOnce((_input: string, init?: RequestInit) => {
        firstSignal = init?.signal;
        return new Promise<Response>(() => undefined);
      })
      .mockImplementationOnce((_input: string, init?: RequestInit) => {
        secondSignal = init?.signal;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            source_asset: "USDC",
            dest_asset: "EURC",
            amount: "1000000",
            estimated_rate: "1.0",
            route: ["USDC", "EURC"],
          }),
        } as Response);
      });
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "1000000" },
    });

    const form = getAmountInput().closest("form")!;
    fireEvent.submit(form);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.submit(form);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(firstSignal?.aborted).toBe(true);
    expect(secondSignal).toBeDefined();

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/USDC → EURC/);
    });

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
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "10000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/1\.00 XLM/);
    });
    const amountValue = screen.getByText("1.00 XLM").closest("dd");
    const rateValue = screen.getByText("1,234").closest("dd");

    expect(amountValue).toHaveAttribute("title", "10000000");
    expect(rateValue).toHaveAttribute("title", "1234");
    expect(rateValue).toHaveTextContent("1,234");
  });

  it("blocks submission when source == destination", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "1" },
    });
    const form = getAmountInput().closest("form")!;
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

    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "1.5" },
    });
    const form = getAmountInput().closest("form")!;
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

    fireEvent.change(getSourceInput(), {
      target: { value: "US$C" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "100" },
    });
    fireEvent.submit(getAmountInput().closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/1-12 letters or numbers/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when an asset code is over length", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(getSourceInput(), {
      target: { value: "TOO-LONG-ASSET" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "100" },
    });
    fireEvent.submit(getAmountInput().closest("form")!);

    await waitFor(() => {
      expect(screen.getByText(/1-12 letters or numbers/i)).toBeInTheDocument();
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("blocks submission when asset codes are whitespace-only", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    render(<QuotePage />);

    fireEvent.change(getSourceInput(), {
      target: { value: "   " },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "100" },
    });
    fireEvent.submit(getAmountInput().closest("form")!);

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

    fireEvent.change(getSourceInput(), {
      target: { value: " USDC " },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: " EURC " },
    });
    fireEvent.change(getAmountInput(), {
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

    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "100" },
    });
    fireEvent.submit(getAmountInput().closest("form")!);

    await waitFor(() => {
      expect(getDestinationInput()).toHaveAttribute("aria-invalid", "true");
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
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
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
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
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
    fireEvent.change(getSourceInput(), {
      target: { value: "USDC" },
    });
    fireEvent.change(getDestinationInput(), {
      target: { value: "EURC" },
    });
    fireEvent.change(getAmountInput(), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(screen.getByText(/must differ/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("alert")).not.toHaveTextContent(/Request ID/);
  });
});

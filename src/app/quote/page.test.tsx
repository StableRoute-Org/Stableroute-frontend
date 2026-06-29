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
      expect(screen.getByRole("alert")).toHaveTextContent(/must differ/i);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/positive integer/i);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/1-12 letters or numbers/i);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/1-12 letters or numbers/i);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/1-12 letters or numbers/i);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/must differ/i);
    });
  });
});

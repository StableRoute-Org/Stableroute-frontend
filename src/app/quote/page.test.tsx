import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ToastProvider";
import QuotePage from "./page";

function renderQuotePage() {
  return render(
    <ToastProvider>
      <QuotePage />
    </ToastProvider>
  );
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe("QuotePage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders the heading and form fields", () => {
    renderQuotePage();
    expect(screen.getByRole("heading", { name: /Get a quote/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Source asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination asset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Amount/i)).toBeInTheDocument();
  });

  it("calls apiClient, renders a multi-hop route, and emits a success toast", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce(
      jsonResponse({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "1000000",
        estimated_rate: "1.0",
        route: ["USDC", "XLM", "EURC"],
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    renderQuotePage();
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
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/quote?source_asset=USDC&dest_asset=EURC&amount=1000000",
        expect.objectContaining({
          headers: { "Content-Type": "application/json" },
        })
      );
    });
    expect(await screen.findByText("Route: USDC → XLM → EURC")).toBeInTheDocument();
    expect(screen.getByText("Amount: 1000000")).toBeInTheDocument();
    expect(screen.getByText("Quote ready for USDC → EURC")).toBeInTheDocument();
  });

  it("blocks submission when source == destination", async () => {
    const mockFetch = jest.fn();
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;
    renderQuotePage();

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
    renderQuotePage();

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

  it("surfaces a backend invalid_request as a role=alert", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      jsonResponse(
        {
          error: "invalid_request",
          message: "source_asset and dest_asset must differ",
        },
        false
      )
    );

    renderQuotePage();
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
      const alerts = screen.getAllByRole("alert");
      expect(alerts[0]).toHaveTextContent(/must differ/i);
      expect(alerts[1]).toHaveTextContent(/must differ/i);
    });
  });

  it("surfaces a network rejection inline and as an error toast", async () => {
    globalThis.fetch = jest.fn().mockRejectedValueOnce(new Error("network down"));

    renderQuotePage();
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
      const alerts = screen.getAllByRole("alert");
      expect(alerts[0]).toHaveTextContent("network down");
      expect(alerts[1]).toHaveTextContent("network down");
    });
  });

  it("keeps the submit button disabled while the quote is loading", async () => {
    let resolveQuote!: (value: Response) => void;
    const quotePromise = new Promise<Response>((resolve) => {
      resolveQuote = resolve;
    });
    globalThis.fetch = jest.fn().mockReturnValueOnce(quotePromise);

    renderQuotePage();
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

    expect(screen.getByRole("button", { name: /Quoting/i })).toBeDisabled();

    resolveQuote(
      jsonResponse({
        source_asset: "USDC",
        dest_asset: "EURC",
        amount: "100",
        estimated_rate: "1.0",
        route: ["USDC", "EURC"],
      })
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Get quote/i })).not.toBeDisabled();
    });
  });

  it("encodes quote query parameters through URLSearchParams", async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce(
      jsonResponse({
        source_asset: "USD/C",
        dest_asset: "EUR C",
        amount: "100",
        estimated_rate: "1.0",
        route: ["USD/C", "EUR C"],
      })
    );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    renderQuotePage();
    fireEvent.change(screen.getByLabelText(/Source asset/i), {
      target: { value: "USD/C" },
    });
    fireEvent.change(screen.getByLabelText(/Destination asset/i), {
      target: { value: "EUR C" },
    });
    fireEvent.change(screen.getByLabelText(/Amount/i), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Get quote/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/quote?source_asset=USD%2FC&dest_asset=EUR+C&amount=100",
        expect.any(Object)
      );
    });
  });

  it("uses the ApiError fallback message when the backend omits message", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      jsonResponse(
        {
          error: "invalid_request",
        },
        false
      )
    );

    renderQuotePage();
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
      const alerts = screen.getAllByRole("alert");
      expect(alerts[0]).toHaveTextContent("quote request failed");
      expect(alerts[1]).toHaveTextContent("quote request failed");
    });
  });
});

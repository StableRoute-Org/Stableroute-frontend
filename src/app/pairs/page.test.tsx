import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ToastProvider";
import PairsPage from "./page";

function renderPairsPage() {
  return render(
    <ToastProvider>
      <PairsPage />
    </ToastProvider>
  );
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  } as unknown as Response;
}

describe("PairsPage", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders pair fees and defaults missing fees to zero", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(
      jsonResponse({
        pairs: [
          { source: "USDC", destination: "EURC", fee_bps: 5 },
          { source: "XLM", destination: "USDC" },
        ],
      })
    );

    renderPairsPage();

    expect(await screen.findByText("Current fee: 5 bps")).toBeInTheDocument();
    expect(screen.getByText("Current fee: 0 bps")).toBeInTheDocument();
    expect(screen.getByLabelText("Fee bps for USDC to EURC")).toHaveValue(5);
    expect(screen.getByLabelText("Fee bps for XLM to USDC")).toHaveValue(0);
  });

  it("saves a valid fee with encoded path segments", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          pairs: [{ source: "USD/C", destination: "EUR C", fee_bps: 5 }],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse({ source: "USD/C", destination: "EUR C", fee_bps: 25 })
      );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    renderPairsPage();

    fireEvent.change(await screen.findByLabelText("Fee bps for USD/C to EUR C"), {
      target: { value: "25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save fee for USD/C to EUR C" }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/v1/pairs/USD%2FC/EUR%20C/fee_bps",
        expect.objectContaining({
          body: JSON.stringify({ fee_bps: 25 }),
          method: "PATCH",
        })
      );
    });
    expect(await screen.findByText("Current fee: 25 bps")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Saved USD/C → EUR C fee");
  });

  it.each(["1001", "-1", "1.5"])(
    "rejects invalid fee %s before calling the backend",
    async (invalidFee) => {
      const mockFetch = jest.fn().mockResolvedValueOnce(
        jsonResponse({
          pairs: [{ source: "USDC", destination: "EURC", fee_bps: 5 }],
        })
      );
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      renderPairsPage();

      fireEvent.change(await screen.findByLabelText("Fee bps for USDC to EURC"), {
        target: { value: invalidFee },
      });
      fireEvent.click(screen.getByRole("button", { name: "Save fee for USDC to EURC" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Fee must be an integer between 0 and 1000 bps."
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    }
  );

  it("rolls back the current fee and draft when the backend rejects the update", async () => {
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          pairs: [{ source: "USDC", destination: "EURC", fee_bps: 5 }],
        })
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { error: "invalid_request", message: "fee cannot be changed" },
          false
        )
      );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    renderPairsPage();

    const feeInput = await screen.findByLabelText("Fee bps for USDC to EURC");
    fireEvent.change(feeInput, { target: { value: "25" } });
    fireEvent.click(screen.getByRole("button", { name: "Save fee for USDC to EURC" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("fee cannot be changed");
    expect(screen.getByText("Current fee: 5 bps")).toBeInTheDocument();
    expect(feeInput).toHaveValue(5);
  });
});

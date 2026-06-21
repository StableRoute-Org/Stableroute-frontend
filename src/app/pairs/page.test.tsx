import { render, screen } from "@testing-library/react";
import PairsPage from "./page";

function jsonResponse(body: unknown, init: Partial<Response> = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => jest.restoreAllMocks());

it("shows the shared loading spinner", () => {
  globalThis.fetch = jest.fn().mockReturnValue(new Promise(() => undefined));

  render(<PairsPage />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading pairs");
});

it("renders pairs returned by useApi", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    jsonResponse({
      pairs: [{ source: "USDC", destination: "EURC" }],
    })
  );

  render(<PairsPage />);

  expect(await screen.findByText("USDC -> EURC")).toBeInTheDocument();
});

it("renders the empty state", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({ pairs: [] }));

  render(<PairsPage />);

  expect(await screen.findByText("No pairs registered yet.")).toBeInTheDocument();
});

it("renders fetch errors as an alert", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    jsonResponse(
      { error: "backend_error", message: "pairs unavailable" },
      { ok: false, status: 503 }
    )
  );

  render(<PairsPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "pairs unavailable"
  );
});

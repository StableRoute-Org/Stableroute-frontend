import { render, screen } from "@testing-library/react";
import EventsPage from "./page";

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

  render(<EventsPage />);

  expect(screen.getByRole("status")).toHaveTextContent("Loading events");
});

it("renders events returned by useApi", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    jsonResponse({
      items: [
        {
          id: "evt_1",
          ts: 1700000000000,
          type: "route.created",
          payload: { source: "USDC" },
        },
      ],
    })
  );

  render(<EventsPage />);

  expect(await screen.findByText("route.created")).toBeInTheDocument();
  expect(screen.getByText(/USDC/)).toBeInTheDocument();
});

it("renders the empty state", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(jsonResponse({ items: [] }));

  render(<EventsPage />);

  expect(await screen.findByText("No events.")).toBeInTheDocument();
});

it("renders fetch errors as an alert", async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(
    jsonResponse(
      { error: "backend_error", message: "events unavailable" },
      { ok: false, status: 503 }
    )
  );

  render(<EventsPage />);

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "events unavailable"
  );
});

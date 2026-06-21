import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EventsPage from "./page";

const events = [
  {
    id: "1",
    ts: 1_700_000_000_000,
    type: "pair.registered",
    payload: { source: "USDC", destination: "EURC" },
  },
  {
    id: "2",
    ts: 1_700_000_001_000,
    type: "api_key.created",
    payload: { prefix: "srk_abcd" },
  },
  {
    id: "3",
    ts: 1_700_000_002_000,
    type: "pair.unregistered",
    payload: { source: "XLM", destination: "USDC" },
  },
];

const mockEvents = (items = events) => {
  globalThis.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ items }),
  } as unknown as Response);
};

describe("EventsPage", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("renders loaded events in source order with a count", async () => {
    mockEvents();
    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByText(/showing 3 of 3 events/i)).toBeInTheDocument();
    });

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent("pair.registered");
    expect(rows[1]).toHaveTextContent("api_key.created");
    expect(rows[2]).toHaveTextContent("pair.unregistered");
  });

  it("filters events by type", async () => {
    mockEvents();
    render(<EventsPage />);

    await screen.findByText(/showing 3 of 3 events/i);
    fireEvent.change(screen.getByLabelText(/event type/i), {
      target: { value: "api_key.created" },
    });

    expect(screen.getByText(/showing 1 of 3 events/i)).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("api_key.created");
  });

  it("filters events by serialized payload substring", async () => {
    mockEvents();
    render(<EventsPage />);

    await screen.findByText(/showing 3 of 3 events/i);
    fireEvent.change(screen.getByLabelText(/payload contains/i), {
      target: { value: "EURC" },
    });

    expect(screen.getByText(/showing 1 of 3 events/i)).toBeInTheDocument();
    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent("pair.registered");
    expect(rows[0]).toHaveTextContent("EURC");
  });

  it("shows EmptyState when filters match nothing", async () => {
    mockEvents();
    render(<EventsPage />);

    await screen.findByText(/showing 3 of 3 events/i);
    fireEvent.change(screen.getByLabelText(/payload contains/i), {
      target: { value: "does-not-exist" },
    });

    expect(screen.getByText(/showing 0 of 3 events/i)).toBeInTheDocument();
    expect(screen.getByText(/no matching events/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("shows EmptyState when no events are loaded", async () => {
    mockEvents([]);
    render(<EventsPage />);

    expect(await screen.findByText(/^No events$/)).toBeInTheDocument();
  });
});

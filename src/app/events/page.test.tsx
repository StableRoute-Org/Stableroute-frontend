import { render, screen, waitFor, within } from "@testing-library/react";
import EventsPage from "./page";
import { MAX_RENDERED_EVENTS } from "@/lib/events";

const mockEventsResponse = (items: unknown[]) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(JSON.stringify({ items })),
  } as unknown as Response);
};

describe("EventsPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("shows the initial loading state while events are pending", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;

    render(<EventsPage />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/v1/events?limit=100",
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("renders one list item per event with type, ISO timestamp, and payload preview", async () => {
    mockEventsResponse([
      {
        id: "evt-second",
        ts: 1_782_460_005_000,
        type: "pair.synced",
        payload: { pair: "XLM-USDC", reserve: "42" },
      },
      {
        id: "evt-first",
        ts: 1_782_460_000_000,
        type: "pair.created",
        payload: { pair: "BTC-XLM", source: "stellar" },
      },
    ]);

    const { container } = render(<EventsPage />);

    await screen.findByText("pair.synced");

    const rows = Array.from(container.querySelectorAll("li"));
    expect(rows).toHaveLength(2);

    expect(within(rows[0]).getByText("pair.synced")).toBeInTheDocument();
    expect(within(rows[0]).getByText(new Date(1_782_460_005_000).toISOString())).toBeInTheDocument();
    expect(within(rows[0]).getByText(/"pair": "XLM-USDC"/)).toBeInTheDocument();
    expect(within(rows[0]).getByText(/"reserve": "42"/)).toBeInTheDocument();

    expect(within(rows[1]).getByText("pair.created")).toBeInTheDocument();
    expect(within(rows[1]).getByText(new Date(1_782_460_000_000).toISOString())).toBeInTheDocument();
    expect(within(rows[1]).getByText(/"source": "stellar"/)).toBeInTheDocument();
  });

  it("preserves the chronological order returned by the API", async () => {
    mockEventsResponse([
      { id: "evt-newer", ts: 1_782_460_010_000, type: "newer", payload: {} },
      { id: "evt-older", ts: 1_782_460_000_000, type: "older", payload: {} },
    ]);

    const { container } = render(<EventsPage />);

    await screen.findByText("newer");

    const eventTypes = Array.from(container.querySelectorAll("li span:first-child")).map(
      (node) => node.textContent,
    );
    expect(eventTypes).toEqual(["newer", "older"]);
  });

  it("renders the empty state when the API returns no events", async () => {
    mockEventsResponse([]);

    render(<EventsPage />);

    expect(await screen.findByText("No events.")).toBeInTheDocument();
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });

  it("surfaces rejected event loads in the alert region", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Failed to load events"));

    render(<EventsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Failed to load events");
    });
  });

  it("drops malformed event records instead of throwing during render", async () => {
    mockEventsResponse([
      { id: "evt1", ts: 1_782_460_000_000, type: "pair.registered", payload: {} },
      { ts: 1_782_460_000_001, type: "missing.id", payload: {} },
      { id: "evt2", ts: "not-a-number", type: "bad.ts", payload: {} },
      { id: "evt3", ts: 1_782_460_000_002, payload: {} },
      { id: "evt4", ts: 1_782_460_000_003, type: "bad.payload" },
      { id: "evt5", ts: 1_782_460_000_004, type: "string.payload", payload: "nope" },
    ]);

    render(<EventsPage />);

    expect(await screen.findByText("pair.registered")).toBeInTheDocument();
    expect(screen.queryByText("missing.id")).not.toBeInTheDocument();
    expect(screen.queryByText("bad.ts")).not.toBeInTheDocument();
    expect(screen.queryByText("bad.payload")).not.toBeInTheDocument();
    expect(screen.queryByText("string.payload")).not.toBeInTheDocument();
  });

  it("bounds rendered records and surfaces a capped note", async () => {
    const events = Array.from({ length: MAX_RENDERED_EVENTS + 3 }, (_, index) => ({
      id: `evt${index}`,
      ts: 1_782_460_000_000 + index,
      type: `event.${index}`,
      payload: { index },
    }));
    mockEventsResponse(events);

    render(<EventsPage />);

    expect(
      await screen.findByText(
        `Showing ${MAX_RENDERED_EVENTS} of ${MAX_RENDERED_EVENTS + 3} events (capped).`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("event.0")).toBeInTheDocument();
    expect(screen.getByText(`event.${MAX_RENDERED_EVENTS - 1}`)).toBeInTheDocument();
    expect(screen.queryByText(`event.${MAX_RENDERED_EVENTS}`)).not.toBeInTheDocument();
  });

  it("truncates oversized payload previews", async () => {
    mockEventsResponse([
      {
        id: "evt-large",
        ts: 1_782_460_000_000,
        type: "payload.large",
        payload: { body: "x".repeat(5000) },
      },
    ]);

    render(<EventsPage />);

    expect(await screen.findByText("payload.large")).toBeInTheDocument();
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
  });
});

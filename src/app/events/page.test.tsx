import { render, screen, waitFor } from "@testing-library/react";
import EventsPage from "./page";
import { MAX_RENDERED_EVENTS } from "@/lib/events";

describe("EventsPage", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows loading before data arrives", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof global.fetch;
    render(<EventsPage />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders events in a single polite live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [{ id: "evt1", ts: Date.now(), type: "pair.registered", payload: {} }],
        }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText("pair.registered")).toBeInTheDocument();
    });
    const live = document.querySelector("[aria-live=polite]");
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute("aria-atomic", "true");
  });

  it("announces empty state via live region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
  });

  it("surfaces errors with role=alert", async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("Failed to load"));

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Failed to load/i);
    });
  });

  it("has exactly one aria-live=polite region", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll("[aria-live=polite]")).toHaveLength(1);
  });

  it("drops malformed event records instead of throwing during render", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { id: "evt1", ts: 1_782_460_000_000, type: "pair.registered", payload: {} },
            { ts: 1_782_460_000_001, type: "missing.id", payload: {} },
            { id: "evt2", ts: "not-a-number", type: "bad.ts", payload: {} },
            { id: "evt3", ts: 1_782_460_000_002, payload: {} },
            { id: "evt4", ts: 1_782_460_000_003, type: "bad.payload" },
            { id: "evt5", ts: 1_782_460_000_004, type: "string.payload", payload: "nope" },
          ],
        }),
    } as unknown as Response);

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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: events }),
    } as unknown as Response);

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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-large",
              ts: 1_782_460_000_000,
              type: "payload.large",
              payload: { body: "x".repeat(5000) },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    expect(await screen.findByText("payload.large")).toBeInTheDocument();
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
  });

  it("renders one list item per event keyed by id with type and payload preview", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-alpha",
              ts: 1_782_460_000_000,
              type: "pair.registered",
              payload: { pairId: "USDC/EURC" },
            },
            {
              id: "evt-beta",
              ts: 1_782_460_000_001,
              type: "pair.updated",
              payload: { feeBps: 25 },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    expect(await screen.findByText("pair.registered")).toBeInTheDocument();
    expect(screen.getByText("pair.updated")).toBeInTheDocument();
    expect(screen.getByText(/USDC\/EURC/)).toBeInTheDocument();
    expect(screen.getByText(/"feeBps": 25/)).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("pair.registered");
    expect(items[1]).toHaveTextContent("pair.updated");
  });

  it("preserves chronological order returned by the API", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-first",
              ts: 1_782_460_000_000,
              type: "event.first",
              payload: { order: 1 },
            },
            {
              id: "evt-second",
              ts: 1_782_460_000_001,
              type: "event.second",
              payload: { order: 2 },
            },
            {
              id: "evt-third",
              ts: 1_782_460_000_002,
              type: "event.third",
              payload: { order: 3 },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    expect(await screen.findByText("event.first")).toBeInTheDocument();
    const types = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(types[0]).toContain("event.first");
    expect(types[1]).toContain("event.second");
    expect(types[2]).toContain("event.third");
  });

});

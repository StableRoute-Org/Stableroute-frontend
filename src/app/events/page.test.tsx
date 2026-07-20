import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import EventsPage from "./page";
import { MAX_RENDERED_EVENTS, MAX_PAYLOAD_PREVIEW_LENGTH } from "@/lib/events";

const okEventsResponse = (items: unknown[]) =>
  ({
    ok: true,
    text: async () => JSON.stringify({ items }),
  }) as unknown as Response;

const eventRecord = (id: string, type = `event.${id}`, payload: unknown = { id }) => ({
  id,
  ts: 1_782_460_000_000,
  type,
  payload,
});

function setDocumentVisibility(state: DocumentVisibilityState, dispatch = true) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  if (!dispatch) return;
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("EventsPage", () => {
  let originalFetch: typeof global.fetch;
  let originalVisibilityState: DocumentVisibilityState;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalVisibilityState = document.visibilityState;
    setDocumentVisibility("visible", false);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    setDocumentVisibility(originalVisibilityState, false);
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
      expect(screen.getByRole("alert")).toHaveTextContent(/Network request failed/i);
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

  it("names the event log region for assistive tech", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    render(<EventsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: /event log entries/i }),
      ).toBeInTheDocument();
    });
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

    expect(await screen.findByText(/200 of 203 events/)).toBeInTheDocument();
    expect(screen.getByText("event.0")).toBeInTheDocument();
    expect(screen.getByText(`event.${MAX_RENDERED_EVENTS - 1}`)).toBeInTheDocument();
    expect(screen.queryByText(`event.${MAX_RENDERED_EVENTS}`)).not.toBeInTheDocument();
  });

  it("truncates oversized payload previews and shows truncated indicator", async () => {
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

  it("renders a show-full button for truncated payloads", async () => {
    const largeString = "x".repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-large",
              ts: 1_782_460_000_000,
              type: "payload.large",
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    // Click Expand to reveal the payload
    const expandButton = await screen.findByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    const showFullButton = await screen.findByRole("button", { name: /^show full$/i });
    expect(showFullButton).toBeInTheDocument();

    fireEvent.click(showFullButton);

    // The full payload should be visible and the button should change
    expect(screen.getByRole("button", { name: /^show truncated$/i })).toBeInTheDocument();
    // The truncated indicator should no longer appear in the <pre> content
    // (the button says "Show truncated" but the payload text itself should be clean)
    const preElements = document.querySelectorAll("pre");
    const hasTruncatedText = Array.from(preElements).some((pre) =>
      pre.textContent?.includes("truncated"),
    );
    expect(hasTruncatedText).toBe(false);
  });

  it("shows full payload when show-full is clicked and toggles back", async () => {
    const largeString = "x".repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-large",
              ts: 1_782_460_000_000,
              type: "payload.large",
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    // Click Expand to reveal the payload
    const expandButton = await screen.findByRole("button", { name: /expand/i });
    fireEvent.click(expandButton);

    // First click: Show full
    const showFullButton = await screen.findByRole("button", { name: /^show full$/i });
    fireEvent.click(showFullButton);

    const showTruncatedButton = await screen.findByRole("button", { name: /^show truncated$/i });
    expect(showTruncatedButton).toBeInTheDocument();

    // Second click: Back to truncated
    fireEvent.click(showTruncatedButton);
    expect(await screen.findByRole("button", { name: /^show full$/i })).toBeInTheDocument();
    // The truncated indicator should be back in the <pre>
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
  });

  it("does not show show-full button for small payloads", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-small",
              ts: 1_782_460_000_000,
              type: "payload.small",
              payload: { note: "small" },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    await screen.findByText("payload.small");
    expect(screen.queryByRole("button", { name: /^show full$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^show truncated$/i })).not.toBeInTheDocument();
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
    expect(screen.getByText(/\"feeBps\": 25/)).toBeInTheDocument();

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("pair.registered");
    expect(items[1]).toHaveTextContent("pair.updated");
  });

  it("copies the full pretty-printed payload when clipboard support is available", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-copy",
              ts: 1_782_460_000_000,
              type: "pair.registered",
              payload: { pairId: "USDC/EURC" },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /copy json/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('{\n  "pairId": "USDC/EURC"\n}');
    });
  });

  it("copies the full payload even when the preview is truncated", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const largeString = "x".repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-large-copy",
              ts: 1_782_460_000_000,
              type: "payload.large",
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    fireEvent.click(await screen.findByRole("button", { name: /copy json/i }));

    await waitFor(() => {
      // The copied text should include the full body string, not be truncated
      const callArg = writeText.mock.calls[0][0] as string;
      expect(callArg).toContain(largeString);
      expect(callArg.length).toBeGreaterThan(MAX_PAYLOAD_PREVIEW_LENGTH);
    });
  });

  it("does not throw when clipboard support is absent", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-copy-missing",
              ts: 1_782_460_000_000,
              type: "pair.registered",
              payload: { pairId: "USDC/EURC" },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    const copyButton = await screen.findByRole("button", { name: /copy json/i });
    expect(() => fireEvent.click(copyButton)).not.toThrow();
  });

  it("defaults large payloads to collapsed and toggles aria-expanded", async () => {
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

    const toggle = await screen.findByRole("button", { name: /expand/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    const controlsId = toggle.getAttribute("aria-controls");
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId ?? "")).toHaveAttribute("hidden");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/\"body\": \"x/)).toBeInTheDocument();
  });

  it("keeps small payloads expanded by default", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: "evt-small",
              ts: 1_782_460_000_000,
              type: "payload.small",
              payload: { note: "small" },
            },
          ],
        }),
    } as unknown as Response);

    render(<EventsPage />);

    const toggle = await screen.findByRole("button", { name: /collapse/i });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/\"note\": \"small\"/)).toBeInTheDocument();
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

  it("keeps live refresh off by default after the initial load", async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue(okEventsResponse([eventRecord("initial")]));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("polls on the fixed interval while live refresh is enabled", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord("initial")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("live")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("tick")]));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Live off" }));

    expect(await screen.findByText("event.live")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live on" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByText("event.tick")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("stops the interval when live refresh is toggled off", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord("initial")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("live")]));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Live off" }));
    expect(await screen.findByText("event.live")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Live on" }));
    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Live off" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("pauses live polling while the tab is hidden and resumes when visible", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord("initial")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("live")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("visible")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("tick")]));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Live off" }));
    expect(await screen.findByText("event.live")).toBeInTheDocument();

    act(() => {
      setDocumentVisibility("hidden");
    });
    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    act(() => {
      setDocumentVisibility("visible");
    });
    expect(await screen.findByText("event.visible")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByText("event.tick")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it("keeps the last successful list when a live refresh fails", async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord("initial")]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord("live")]))
      .mockRejectedValueOnce(new Error("refresh failed"));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Live off" }));
    expect(await screen.findByText("event.live")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Network request failed");
    expect(screen.getByText("event.live")).toBeInTheDocument();
  });

  it("shows when the event list was last updated", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-16T10:00:00.000Z"));
    global.fetch = jest.fn().mockResolvedValue(okEventsResponse([eventRecord("initial")]));

    render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("cleans up the live interval and visibility listener on unmount", async () => {
    jest.useFakeTimers();
    const removeEventListenerSpy = jest.spyOn(document, "removeEventListener");
    global.fetch = jest.fn().mockResolvedValue(okEventsResponse([eventRecord("initial")]));

    const { unmount } = render(<EventsPage />);

    expect(await screen.findByText("event.initial")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Live off" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    expect(jest.getTimerCount()).toBe(0);

    removeEventListenerSpy.mockRestore();
  });

  describe("payload safety", () => {
    it("handles deeply nested payloads without crashing", async () => {
      let deep: Record<string, unknown> = {};
      let current = deep;
      for (let i = 0; i < 100; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`] as Record<string, unknown>;
      }
      current.value = "bottom";

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: "evt-deep",
                ts: 1_782_460_000_000,
                type: "payload.deep",
                payload: deep,
              },
            ],
          }),
      } as unknown as Response);

      render(<EventsPage />);
      expect(await screen.findByText("payload.deep")).toBeInTheDocument();
      expect(screen.getByText(/level0/)).toBeInTheDocument();
    });

    it("renders empty payloads as {} without error", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: "evt-empty",
                ts: 1_782_460_000_000,
                type: "payload.empty",
                payload: {},
              },
            ],
          }),
      } as unknown as Response);

      render(<EventsPage />);
      expect(await screen.findByText("payload.empty")).toBeInTheDocument();
      expect(screen.getByText(/\{\s*\}/)).toBeInTheDocument();
    });

    it("renders primitive-only payloads correctly", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: "evt-primitive",
                ts: 1_782_460_000_000,
                type: "payload.primitive",
                payload: { str: "hello", num: 42, bool: true, nil: null },
              },
            ],
          }),
      } as unknown as Response);

      render(<EventsPage />);
      expect(await screen.findByText("payload.primitive")).toBeInTheDocument();
      expect(screen.getByText(/"hello"/)).toBeInTheDocument();
      expect(screen.getByText(/42/)).toBeInTheDocument();
      expect(screen.getByText(/true/)).toBeInTheDocument();
      expect(screen.getByText(/null/)).toBeInTheDocument();
    });

    it("renders array payloads without crashing", async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: "evt-array",
                ts: 1_782_460_000_000,
                type: "payload.array",
                payload: { items: [1, 2, 3, { nested: true }] },
              },
            ],
          }),
      } as unknown as Response);

      render(<EventsPage />);
      expect(await screen.findByText("payload.array")).toBeInTheDocument();
      expect(screen.getByText(/nested/)).toBeInTheDocument();
    });
  });
});

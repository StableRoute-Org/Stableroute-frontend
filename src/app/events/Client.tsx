"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { TimeAgo } from "@/components/TimeAgo";
import { useToast } from "@/components/ToastProvider";
import { apiGet } from "@/lib/apiClient";
import { writeToClipboard } from "@/lib/clipboard";
import { parseEventsResponse, type DisplayEvent } from "@/lib/events";

const REFRESH_MS = 10_000;
const COLLAPSE_THRESHOLD = 400;

/**
 * Determines whether a payload should start collapsed based on the serialized
 * payload length.
 */
function shouldStartCollapsed(payloadJson: string) {
  return payloadJson.length > COLLAPSE_THRESHOLD;
}

export default function EventsClient() {
  const { push } = useToast();
  const [items, setItems] = useState<DisplayEvent[] | null>(null);
  const [totalValid, setTotalValid] = useState(0);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState === "visible",
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showFull, setShowFull] = useState<Record<string, boolean>>({});

  const filteredItems = useMemo(() => {
    if (!items) return null;
    const needle = typeFilter.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((event) => event.type.toLowerCase().includes(needle));
  }, [items, typeFilter]);

  const load = useCallback(() => {
    return apiGet<unknown>("/api/v1/events?limit=100")
      .then((body) => {
        const parsed = parseEventsResponse(body);
        setItems(parsed.events);
        setTotalValid(parsed.totalValid);
        setCapped(parsed.capped);
        setLastUpdatedAt(Date.now());
        setError(null);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /**
   * Runs the opt-in event-log polling loop only while Live mode is enabled and
   * the tab is visible. Hidden tabs clear the interval; returning to a visible
   * tab refreshes once immediately and then resumes the fixed cadence.
   */
  useEffect(() => {
    if (!live || !isVisible) return;
    void load();
    const timer = setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => {
      clearInterval(timer);
    };
  }, [isVisible, live, load]);

  const resultLabel = useMemo(() => {
    if (!items) return "";
    if (items.length === 0) return "0 events";
    return capped
      ? `Showing ${items.length} of ${totalValid} events (capped).`
      : `${items.length} events`;
  }, [items, capped, totalValid]);

  const handleCopyPayload = useCallback(
    async (eventId: string, payloadJson: string) => {
      const result = await writeToClipboard(payloadJson);
      if (result.ok) return;
      // Reveal the payload so the user can select and copy it manually.
      setExpanded((current) => ({ ...current, [eventId]: true }));
      push("Couldn't copy automatically. Select the payload below to copy it.", "error");
    },
    [push],
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700"
          >
            Refresh now
          </button>
          <button
            type="button"
            aria-pressed={live}
            onClick={() => setLive((value) => !value)}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700"
          >
            {live ? "Live on" : "Live off"}
          </button>
        </div>
      </div>
      {lastUpdatedAt && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Last updated <TimeAgo ts={lastUpdatedAt} />
        </p>
      )}
      <label className="flex max-w-sm flex-col gap-1 text-sm">
        <span>Filter by event type</span>
        <input
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          placeholder="pair.registered"
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <section
        aria-labelledby="events-log-heading"
        aria-live="polite"
        aria-atomic="true"
        className="contents"
      >
        <h2 id="events-log-heading" className="sr-only">
          Event log entries
        </h2>
        {!items && !error && <p>Loading…</p>}
        {items && items.length === 0 && (
          <EmptyState
            title="No events yet"
            description="Router events will appear here once activity starts."
          />
        )}
        {filteredItems && filteredItems.length > 0 && (
          <>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{resultLabel}</p>
            <ol className="flex flex-col gap-2">
              {filteredItems.map((event) => {
                const isPayloadTruncated = event.payloadPreview !== event.fullPayload;
                const payloadJson = isPayloadTruncated && showFull[event.id]
                  ? event.fullPayload
                  : event.payloadPreview;
                const defaultOpen = !shouldStartCollapsed(event.payloadPreview);
                const isOpen = expanded[event.id] ?? defaultOpen;
                const controlsId = `event-payload-${event.id}`;
                return (
                  <li
                    key={event.id}
                    className="rounded border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-500">
                      <span>{event.type}</span>
                      <span>{new Date(event.ts).toISOString()}</span>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        aria-expanded={isOpen}
                        aria-controls={controlsId}
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [event.id]: !isOpen,
                          }))
                        }
                        className="px-3 py-1 text-[11px]"
                      >
                        {isOpen ? "Collapse" : "Expand"}
                      </Button>
                      {isPayloadTruncated && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setShowFull((current) => ({
                              ...current,
                              [event.id]: !current[event.id],
                            }))
                          }
                          className="px-3 py-1 text-[11px]"
                        >
                          {showFull[event.id] ? "Show truncated" : "Show full"}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          void handleCopyPayload(event.id, event.fullPayload)
                        }
                        className="px-3 py-1 text-[11px]"
                      >
                        Copy JSON
                      </Button>
                    </div>
                    <div id={controlsId} hidden={!isOpen}>
                      <pre className="mt-2 whitespace-pre-wrap break-words">
                        {payloadJson}
                      </pre>
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </section>
    </main>
  );
}


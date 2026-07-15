"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { TimeAgo } from "@/components/TimeAgo";
import { apiGet } from "@/lib/apiClient";
import { parseEventsResponse, type DisplayEvent } from "@/lib/events";

const REFRESH_MS = 10_000;

export default function EventsClient() {
  const [items, setItems] = useState<DisplayEvent[] | null>(null);
  const [totalValid, setTotalValid] = useState(0);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
        setError(null);
      })
      .catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      void load();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, paused]);

  const resultLabel = useMemo(() => {
    if (!items) return "";
    if (items.length === 0) return "0 events";
    return capped ? `${items.length} of ${totalValid} events` : `${items.length} events`;
  }, [items, capped, totalValid]);

  const copyPayload = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
    } catch {
      /* clipboard unavailable in test/jsdom */
    }
  };

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
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm dark:border-neutral-700"
          >
            {paused ? "Resume auto-refresh" : "Pause auto-refresh"}
          </button>
        </div>
      </div>
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
                const isOpen = expanded[event.id] ?? true;
                return (
                  <li
                    key={event.id}
                    className="rounded border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-800"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-500">
                      <span>{event.type}</span>
                      <TimeAgo ts={event.ts} />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((current) => ({
                            ...current,
                            [event.id]: !isOpen,
                          }))
                        }
                        className="rounded border border-neutral-300 px-2 py-0.5 text-[11px] dark:border-neutral-700"
                      >
                        {isOpen ? "Collapse" : "Expand"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyPayload(event.payloadPreview)}
                        className="rounded border border-neutral-300 px-2 py-0.5 text-[11px] dark:border-neutral-700"
                      >
                        Copy JSON
                      </button>
                    </div>
                    {isOpen && (
                      <pre className="mt-2 whitespace-pre-wrap break-words">
                        {event.payloadPreview}
                      </pre>
                    )}
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { apiGet } from "@/lib/apiClient";

type AppEvent = {
  id: string;
  ts: number;
  type: string;
  payload: Record<string, unknown>;
};

/**
 * Filter loaded events without mutating their chronological source order.
 */
function filterEvents(events: AppEvent[], typeFilter: string, payloadFilter: string) {
  const query = payloadFilter.trim().toLowerCase();
  return events.filter((event) => {
    const matchesType = typeFilter === "all" || event.type === typeFilter;
    const matchesPayload =
      query.length === 0 || JSON.stringify(event.payload).toLowerCase().includes(query);
    return matchesType && matchesPayload;
  });
}

export default function EventsPage() {
  const [items, setItems] = useState<AppEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [payloadFilter, setPayloadFilter] = useState("");

  useEffect(() => {
    apiGet<{ items: AppEvent[] }>("/api/v1/events?limit=100")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  }, []);

  const typeOptions = useMemo(
    () => Array.from(new Set((items ?? []).map((event) => event.type))).sort(),
    [items]
  );
  const filteredItems = useMemo(
    () => (items ? filterEvents(items, typeFilter, payloadFilter) : []),
    [items, typeFilter, payloadFilter]
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {items && items.length === 0 && (
        <EmptyState title="No events" description="No backend events have been recorded yet." />
      )}
      {items && items.length > 0 && (
        <>
          <div className="grid gap-3 rounded border border-neutral-200 p-4 dark:border-neutral-800 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Event type
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-2 font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="all">All event types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Payload contains
              <input
                value={payloadFilter}
                onChange={(e) => setPayloadFilter(e.target.value)}
                placeholder="Search payload JSON"
                className="rounded-md border border-neutral-300 px-3 py-2 font-normal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
              />
            </label>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Showing {filteredItems.length} of {items.length} events
          </p>
          {filteredItems.length === 0 ? (
            <EmptyState
              title="No matching events"
              description="Adjust the event type or payload filter to widen the results."
            />
          ) : (
            <ol className="flex flex-col gap-2">
              {filteredItems.map((e) => (
                <li
                  key={e.id}
                  className="rounded border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-800"
                >
                  <div className="flex justify-between text-neutral-500">
                    <span>{e.type}</span>
                    <span>{new Date(e.ts).toISOString()}</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </main>
  );
}

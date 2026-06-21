"use client";

import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type AppEvent = {
  id: string;
  ts: number;
  type: string;
  payload: Record<string, unknown>;
};

type EventsResponse = { items: AppEvent[] };

/**
 * Uses the shared read-only API hook so loading, error, and ok states match
 * other dashboard fetch surfaces.
 */
export default function EventsPage() {
  const state = useApi<EventsResponse>("/api/v1/events?limit=100");
  const items = state.status === "ok" ? state.data.items : null;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
      {state.status === "loading" && <Spinner label="Loading events" />}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {items && items.length === 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No events.
        </p>
      )}
      {items && items.length > 0 && (
        <ol className="flex flex-col gap-2">
          {items.map((event) => (
            <li
              key={event.id}
              className="rounded border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-800"
            >
              <div className="flex justify-between text-neutral-500">
                <span>{event.type}</span>
                <span>{new Date(event.ts).toISOString()}</span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap break-words">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}

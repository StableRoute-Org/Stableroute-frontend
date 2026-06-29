"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { parseEventsResponse, type DisplayEvent } from "@/lib/events";

export default function EventsClient() {
  const [items, setItems] = useState<DisplayEvent[] | null>(null);
  const [totalValid, setTotalValid] = useState(0);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<unknown>("/api/v1/events?limit=100")
      .then((b) => {
        const parsed = parseEventsResponse(b);
        setItems(parsed.events);
        setTotalValid(parsed.totalValid);
        setCapped(parsed.capped);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <section aria-live="polite" aria-atomic="true" className="contents">
        {!items && !error && <p>Loading…</p>}
        {items && items.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No events.</p>
        )}
        {items && items.length > 0 && (
          <>
            {capped && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Showing {items.length} of {totalValid} events (capped).
              </p>
            )}
            <ol className="flex flex-col gap-2">
              {items.map((e) => (
                <li
                  key={e.id}
                  className="rounded border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-800"
                >
                  <div className="flex justify-between text-neutral-500">
                    <span>{e.type}</span>
                    <span>{new Date(e.ts).toISOString()}</span>
                  </div>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {e.payloadPreview}
                  </pre>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </main>
  );
}

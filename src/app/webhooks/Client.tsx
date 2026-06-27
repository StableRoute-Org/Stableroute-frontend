"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";

type Hook = { id: string; url: string; events: string[]; createdAt: number };

export default function WebhooksClient() {
  const [items, setItems] = useState<Hook[] | null>(null);
  const [url, setUrl] = useState("");
  const [eventsCsv, setEventsCsv] = useState("pair.registered");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    apiGet<{ items: Hook[] }>("/api/v1/webhooks")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const events = eventsCsv.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await apiPost("/api/v1/webhooks", { url, events });
      setUrl("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
      <form onSubmit={onCreate} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>URL</span>
          <input
            required
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Events (comma-separated)</span>
          <input
            required
            value={eventsCsv}
            onChange={(e) => setEventsCsv(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Register
        </button>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      </form>
      {!items && !error && <p>Loading…</p>}
      <section aria-live="polite" aria-atomic="true" className="contents">
        {items && items.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No webhooks registered.</p>
        )}
        {items && items.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((w) => (
              <li key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium break-all">{w.url}</p>
                  <p className="text-xs text-neutral-500">{w.events.join(", ")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => apiDelete(`/api/v1/webhooks/${w.id}`).then(() => load())}
                  className="rounded border border-neutral-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

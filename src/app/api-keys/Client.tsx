"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";

type Item = { prefix: string; label: string; createdAt: number };

export default function ApiKeysClient() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    apiGet<{ items: Item[] }>("/api/v1/api-keys")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const r = await apiPost<{ key: string }>("/api/v1/api-keys", { label });
      setCreated(r.key);
      setLabel("");
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
      <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
      <form onSubmit={onCreate} className="flex gap-2">
        <input
          required
          maxLength={64}
          aria-label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Create
        </button>
      </form>
      {created && (
        <div role="status" className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          <p className="font-medium">Copy now — shown only once:</p>
          <code className="break-all">{created}</code>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {!items && !error && <p>Loading…</p>}
      <section aria-live="polite" aria-atomic="true" className="contents">
        {items && items.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No API keys yet.</p>
        )}
        {items && items.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((k) => (
              <li key={k.prefix} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{k.label}</p>
                  <p className="font-mono text-xs text-neutral-500">{k.prefix}…</p>
                </div>
                <button
                  type="button"
                  onClick={() => apiDelete(`/api/v1/api-keys/${k.prefix}`).then(() => load())}
                  className="rounded border border-neutral-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

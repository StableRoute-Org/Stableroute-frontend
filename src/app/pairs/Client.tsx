"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { apiDelete, apiGet } from "@/lib/apiClient";

type Pair = { source: string; destination: string };

export default function PairsClient() {
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pair | null>(null);
  const isLoading = pairs === null && error === null;

  const load = () =>
    apiGet<{ pairs: Pair[] }>("/api/v1/pairs")
      .then((body) => setPairs(body.pairs))
      .catch((err) => setError(err.message));

  useEffect(() => {
    void load();
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Pairs</h1>
        <Link
          href="/pairs/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
        >
          New pair
        </Link>
      </header>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <section aria-live="polite" aria-atomic="true" aria-busy={isLoading} className="contents">
        {isLoading && <p>Loading…</p>}
        {pairs && pairs.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No pairs registered yet.
          </p>
        )}
        {pairs && pairs.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {pairs.map((pair) => (
              <li
                key={`${pair.source}::${pair.destination}`}
                className="flex items-center justify-between gap-3 py-3"
              >
                <span className="font-mono text-sm">
                  {pair.source} → {pair.destination}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/quote?source=${encodeURIComponent(pair.source)}&dest=${encodeURIComponent(pair.destination)}`}
                    className="rounded border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                  >
                    Quote
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(pair)}
                    className="rounded border border-neutral-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 dark:border-neutral-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Delete pair?"
        description={
          pendingDelete
            ? `Remove ${pendingDelete.source} → ${pendingDelete.destination} from the router.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          const target = pendingDelete;
          setPendingDelete(null);
          void apiDelete(
            `/api/v1/pairs/${encodeURIComponent(target.source)}/${encodeURIComponent(target.destination)}`,
          ).then(() => load());
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

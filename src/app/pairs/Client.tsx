"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";
import { Spinner } from "@/components/Spinner";
import { apiDelete } from "@/lib/apiClient";
import { useApi } from "@/lib/useApi";

type Pair = { source: string; destination: string };

export default function PairsClient() {
  const { status, data, error, refetch } = useApi<{ pairs: Pair[] }>("/api/v1/pairs");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Pair | null>(null);

  const pairs = status === "ok" ? data.pairs : null;
  const filtered = useMemo(() => {
    if (!pairs) return null;
    const needle = query.trim().toLowerCase();
    if (!needle) return pairs;
    return pairs.filter(
      (pair) =>
        pair.source.toLowerCase().includes(needle) ||
        pair.destination.toLowerCase().includes(needle),
    );
  }, [pairs, query]);

  // Group destinations by source asset so operators can see structure
  // at a glance when many destinations share a source. Sources are sorted
  // alphabetically; destinations within a group preserve their original
  // order from the API.
  const grouped = useMemo(() => {
    if (!filtered) return null;
    const map = new Map<string, Pair[]>();
    for (const pair of filtered) {
      const bucket = map.get(pair.source) ?? [];
      bucket.push(pair);
      map.set(pair.source, bucket);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([source, destinations]) => ({ source, destinations }));
  }, [filtered]);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8">
      <PageHeading
        title="Pairs"
        description="Registered routing pairs for the StableRoute router."
        action={
          <Link href="/pairs/new" className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
            New pair
          </Link>
        }
      />
      <label className="flex flex-col gap-1 text-sm">
        <span>Filter pairs</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by asset code"
          className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </label>
      {status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <section aria-live="polite" aria-busy={status === "loading"} className="contents">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Spinner label="Loading pairs" />
            Loading…
          </div>
        )}
        {filtered && filtered.length === 0 && (
          <EmptyState title="No pairs found" description="Try a different filter or register a new pair." />
        )}
        {grouped && grouped.length > 0 && (
          <div className="flex flex-col gap-6">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {grouped.length} source{grouped.length === 1 ? "" : "s"} · {filtered.length} pair
              {filtered.length === 1 ? "" : "s"} total
            </p>
            {grouped.map(({ source, destinations }) => (
              <section
                key={source}
                aria-labelledby={`group-${source}`}
                className="flex flex-col gap-2"
              >
                <h3
                  id={`group-${source}`}
                  className="flex items-baseline gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  <span className="font-mono">{source}</span>
                  <span className="text-xs font-normal text-neutral-500">
                    {destinations.length} destination{destinations.length === 1 ? "" : "s"}
                  </span>
                </h3>
                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {destinations.map((pair) => (
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
                          className="rounded border px-3 py-1 text-xs dark:border-neutral-700"
                        >
                          Quote
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(pair)}
                          className="rounded border px-3 py-1 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Delete pair?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          const target = pendingDelete;
          setPendingDelete(null);
          void apiDelete(
            `/api/v1/pairs/${encodeURIComponent(target.source)}/${encodeURIComponent(target.destination)}`,
          ).then(() => refetch());
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

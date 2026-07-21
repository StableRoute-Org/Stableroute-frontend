"use client";

import { useCallback, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";
import { Spinner } from "@/components/Spinner";
import { apiDelete } from "@/lib/apiClient";
import { useApi } from "@/lib/useApi";
import { filterPairs, groupBySource, type Pair } from "./pairsUtils";

export default function PairsClient() {
  const result = useApi<{ pairs: Pair[] }>("/api/v1/pairs");
  const { status, refetch } = result;
  const data = result.status === "ok" ? result.data : null;
  const error = result.status === "error" ? result.error : null;
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Pair | null>(null);

  const pairs = status === "ok" && data ? data.pairs : null;

  // Keyed on [pairs, query]: only recomputes when the loaded rows or the
  // search text actually change, not on unrelated state (e.g. opening the
  // delete confirmation dialog).
  const filtered = useMemo(() => {
    if (!pairs) return null;
    return filterPairs(pairs, query);
  }, [pairs, query]);

  // Grouping is a second, separate derivation from `filtered`. Without its
  // own memo it would still re-run on every render (e.g. toggling the
  // delete dialog) even though `filtered` itself was already stable.
  const grouped = useMemo(() => (filtered ? groupBySource(filtered) : []), [filtered]);

  const handleQueryChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setPendingDelete((current) => {
      if (current) {
        void apiDelete(
          `/api/v1/pairs/${encodeURIComponent(current.source)}/${encodeURIComponent(current.destination)}`,
        ).then(() => refetch());
      }
      return null;
    });
  }, [refetch]);

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8">
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            Pairs
            {pairs !== null && (
              <Badge variant="neutral">{pairs.length} pair{pairs.length !== 1 ? "s" : ""}</Badge>
            )}
          </span>
        }
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
          onChange={handleQueryChange}
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
        {filtered && filtered.length === 0 && pairs && pairs.length === 0 && (
          <EmptyState title="No pairs registered yet" description="Create your first source→destination routing pair." />
        )}
        {filtered && filtered.length === 0 && pairs && pairs.length > 0 && (
          <EmptyState title="No pairs found" description="Try a different filter or register a new pair." />
        )}
        {filtered && filtered.length > 0 && (
          <div className="flex flex-col gap-6">
            {grouped.map(([source, destinations]) => (
              <section key={source}>
                <h2 className="mb-2 text-lg font-semibold tracking-tight">{source}</h2>
                <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                  {destinations.map((dest) => (
                    <li key={`${source}::${dest}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="font-mono text-sm">{dest}</span>
                      <div className="flex gap-2">
                        <Link
                          href={`/quote?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(dest)}`}
                          className="rounded border px-3 py-1 text-xs dark:border-neutral-700"
                        >
                          Quote
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete({ source, destination: dest })}
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
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </main>
  );
}
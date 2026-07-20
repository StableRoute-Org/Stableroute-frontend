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

type SortKey = "source" | "destination";
type SortDir = "ascending" | "descending";

/** Stable sort: equal values preserve insertion order (Array.prototype.sort is stable in V8/JSC). */
function sortPairs(pairs: Pair[], key: SortKey, dir: SortDir): Pair[] {
  return [...pairs].sort((a, b) => {
    const cmp = a[key].localeCompare(b[key], undefined, { sensitivity: "base" });
    return dir === "ascending" ? cmp : -cmp;
  });
}

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

interface SortHeaderProps {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey | null;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function SortHeader({ label, sortKey, activeSortKey, sortDir, onSort }: SortHeaderProps) {
  const isActive = activeSortKey === sortKey;
  const ariaSort: React.AriaAttributes["aria-sort"] = isActive ? sortDir : "none";
  const indicator = isActive ? (sortDir === "ascending" ? " ▲" : " ▼") : "";

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`flex items-center gap-1 rounded font-semibold uppercase tracking-wide hover:text-neutral-900 dark:hover:text-neutral-100 ${ring}`}
        aria-label={`Sort by ${label}${isActive ? `, currently ${sortDir}` : ""}`}
      >
        {label}
        <span aria-hidden="true" className="w-3 text-center">
          {indicator}
        </span>
      </button>
    </th>
  );
}

export default function PairsClient() {
  const { status, data, error, refetch } = useApi<{ pairs: Pair[] }>("/api/v1/pairs");
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Pair | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("ascending");

  const pairs = status === "ok" ? data.pairs : null;

  const filtered = useMemo(() => {
    if (!pairs) return null;
    const needle = query.trim().toLowerCase();
    const base = needle
      ? pairs.filter(
          (pair) =>
            pair.source.toLowerCase().includes(needle) ||
            pair.destination.toLowerCase().includes(needle),
        )
      : pairs;
    return sortKey ? sortPairs(base, sortKey, sortDir) : base;
  }, [pairs, query, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "ascending" ? "descending" : "ascending"));
    } else {
      setSortKey(key);
      setSortDir("ascending");
    }
  }

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
      <section aria-live="polite" aria-atomic="true" aria-busy={status === "loading"} className="contents">
        {status === "loading" && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Spinner label="Loading pairs" />
            Loading…
          </div>
        )}
        {filtered && filtered.length === 0 && (
          <EmptyState title="No pairs found" description="Try a different filter or register a new pair." />
        )}
        {filtered && filtered.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
                <tr>
                  <SortHeader
                    label="Source"
                    sortKey="source"
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortHeader
                    label="Destination"
                    sortKey="destination"
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filtered.map((pair) => (
                  <tr
                    key={`${pair.source}::${pair.destination}`}
                    className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                  >
                    <td className="px-4 py-3 font-mono">{pair.source}</td>
                    <td className="px-4 py-3 font-mono">{pair.destination}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/quote?source=${encodeURIComponent(pair.source)}&dest=${encodeURIComponent(pair.destination)}`}
                          className={`rounded border px-3 py-1 text-xs dark:border-neutral-700 ${ring}`}
                        >
                          Quote
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(pair)}
                          className={`rounded border px-3 py-1 text-xs ${ring}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

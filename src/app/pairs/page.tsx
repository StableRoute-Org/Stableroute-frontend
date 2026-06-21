"use client";

import Link from "next/link";
import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type Pair = { source: string; destination: string };
type PairsResponse = { pairs: Pair[] };

/**
 * Keeps the dashboard list aligned with the shared read-only API state model.
 */
export default function PairsPage() {
  const state = useApi<PairsResponse>("/api/v1/pairs");
  const pairs = state.status === "ok" ? state.data.pairs : null;

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
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          New pair
        </Link>
      </header>
      {state.status === "loading" && <Spinner label="Loading pairs" />}
      {state.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {pairs && pairs.length === 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No pairs registered yet.
        </p>
      )}
      {pairs && pairs.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {pairs.map((p) => (
            <li
              key={`${p.source}::${p.destination}`}
              className="py-3 font-mono text-sm"
            >
              {p.source} -&gt; {p.destination}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

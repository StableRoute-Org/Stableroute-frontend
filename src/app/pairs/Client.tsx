"use client";

import Link from "next/link";
import { useApi } from "@/lib/useApi";

type Pair = { source: string; destination: string };

export default function PairsClient() {
  const pairsState = useApi<{ pairs: Pair[] }>("/api/v1/pairs");
  const isLoading = pairsState.status === "loading";
  const error = pairsState.status === "error" ? pairsState.error : null;
  const pairs = pairsState.status === "ok" ? pairsState.data.pairs : null;

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
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <section
        aria-live="polite"
        aria-atomic="true"
        aria-busy={isLoading}
        className="contents"
      >
        {isLoading && <p>Loading…</p>}
        {pairs && pairs.length === 0 && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No pairs registered yet.
          </p>
        )}
        {pairs && pairs.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {pairs.map((p) => (
              <li key={`${p.source}::${p.destination}`} className="py-3 font-mono text-sm">
                {p.source} → {p.destination}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

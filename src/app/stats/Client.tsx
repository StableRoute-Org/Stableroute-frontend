"use client";

import { useApi } from "@/lib/useApi";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { StatTile } from "@/components/StatTile";

type Stats = { totalPairs: number; paused: boolean };

export default function StatsClient() {
  const api = useApi<Stats>("/api/v1/stats");

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {api.status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {api.error}
        </p>
      )}
      {api.status === "loading" && (
        <div className="flex items-center gap-2 text-sm">
          <Spinner label="Loading stats" />
          Loading…
        </div>
      )}
      {api.status === "ok" && (
        <section aria-labelledby="stats-metrics-heading">
          <h2 id="stats-metrics-heading" className="sr-only">
            Router metrics
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <StatTile label="Pairs" value={formatNumber(api.data.totalPairs)} />
            <StatTile label="Status" value={api.data.paused ? "Paused" : "Live"} />
          </dl>
        </section>
      )}
      {api.status === "ok" && api.data.totalPairs === 0 && (
        <EmptyState title="No pairs yet" description="Register a pair to see metrics." />
      )}
    </main>
  );
}

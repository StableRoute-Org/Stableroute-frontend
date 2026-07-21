"use client";

import { useEffect } from "react";
import { useApi } from "@/lib/useApi";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { StatTile } from "@/components/StatTile";

type Stats = { totalPairs: number; paused: boolean };

/** Poll cadence for the stats dashboard (see ARCHITECTURE.md, "Data flow"). */
const POLL_MS = 5_000;

export default function StatsClient() {
  const result = useApi<Stats>("/api/v1/stats");
  const { refetch } = result;
  const status = result.status;
  const error = status === "error" ? result.error : null;
  const data = status === "ok" ? result.data : null;
  const { refetch } = result;

  // Poll for fresh router metrics on a fixed cadence (see ARCHITECTURE.md,
  // "Data flow").
  useEffect(() => {
    const timer = setInterval(refetch, POLL_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  // Poll the router metrics on a fixed cadence; clear the interval on unmount.
  useEffect(() => {
    const id = setInterval(refetch, POLL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {status === "error" && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm">
          <Spinner label="Loading stats" />
          Loading…
        </div>
      )}
      {status === "ok" && data && (
        <section aria-labelledby="stats-metrics-heading">
          <h2 id="stats-metrics-heading" className="sr-only">
            Router metrics
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <StatTile label="Pairs" value={formatNumber(data.totalPairs)} />
            <StatTile label="Status" value={data.paused ? "Paused" : "Live"} />
          </dl>
        </section>
      )}
      {status === "ok" && data && data.totalPairs === 0 && (
        <EmptyState title="No pairs yet" description="Register a pair to see metrics." />
      )}
    </main>
  );
}

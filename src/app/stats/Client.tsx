"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { formatNumber } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { StatTile } from "@/components/StatTile";

type Stats = { totalPairs: number; paused: boolean };

const POLL_INTERVAL_MS = 5_000;

export default function StatsClient() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      apiGet<Stats>("/api/v1/stats")
        .then((body) => {
          if (cancelled) return;
          setData(body);
          setError(null);
          setStatus("ok");
        })
        .catch((err) => {
          if (cancelled) return;
          setError((err as Error).message ?? "failed to load");
          setStatus("error");
        });
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

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

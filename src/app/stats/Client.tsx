"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { formatNumber } from "@/lib/format";
import { StatTile } from "@/components/StatTile";

type Stats = { totalPairs: number; paused: boolean };

export default function StatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = () =>
      apiGet<Stats>("/api/v1/stats")
        .then((s) => !cancelled && setStats(s))
        .catch((e) => !cancelled && setError(e.message));
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {stats && (
        <dl className="grid grid-cols-2 gap-4">
          <StatTile label="Pairs" value={formatNumber(stats.totalPairs)} />
          <StatTile
            label="Status"
            value={stats.paused ? "Paused" : "Live"}
          />
        </dl>
      )}
    </main>
  );
}

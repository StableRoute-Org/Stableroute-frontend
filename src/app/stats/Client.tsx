"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";

type Stats = { totalPairs: number; paused: boolean };

export function StatsClient({
  initial,
  error: initialError,
}: {
  initial: Stats | null;
  error: string | null;
}) {
  const [stats, setStats] = useState<Stats | null>(initial);
  const [error, setError] = useState<string | null>(initialError);

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

  if (error) {
    return <p role="alert" className="text-sm text-rose-600">{error}</p>;
  }
  if (!stats) {
    return <p className="text-sm text-neutral-500">Loading stats…</p>;
  }

  return (
    <dl className="grid grid-cols-2 gap-4">
      <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
        <dt className="text-xs uppercase text-neutral-500">Pairs</dt>
        <dd className="mt-1 text-2xl font-semibold">{stats.totalPairs}</dd>
      </div>
      <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
        <dt className="text-xs uppercase text-neutral-500">Status</dt>
        <dd className="mt-1 text-2xl font-semibold">
          {stats.paused ? "Paused" : "Live"}
        </dd>
      </div>
    </dl>
  );
}

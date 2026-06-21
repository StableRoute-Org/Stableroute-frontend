"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/StatTile";
import { TimeAgo } from "@/components/TimeAgo";
import { apiGet } from "@/lib/apiClient";

type Stats = { totalPairs: number; paused: boolean };

const POLL_INTERVAL_MS = 5000;

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(false);
  const stoppedByErrorRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const nextStats = await apiGet<Stats>("/api/v1/stats");
      if (!mountedRef.current) return false;
      setStats(nextStats);
      setLastUpdated(Date.now());
      setError(null);
      stoppedByErrorRef.current = false;
      return true;
    } catch (e) {
      if (!mountedRef.current) return false;
      setError((e as Error).message);
      stoppedByErrorRef.current = true;
      stopPolling();
      return false;
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [stopPolling]);

  /** Starts polling only while the tab is visible and the last request succeeded. */
  const startPolling = useCallback(() => {
    stopPolling();
    if (document.visibilityState === "hidden" || stoppedByErrorRef.current) return;
    intervalRef.current = setInterval(() => {
      void loadStats();
    }, POLL_INTERVAL_MS);
  }, [loadStats, stopPolling]);

  const refresh = useCallback(async () => {
    const ok = await loadStats();
    if (ok) startPolling();
  }, [loadStats, startPolling]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        stopPolling();
        return;
      }
      void refresh();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      mountedRef.current = false;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh, stopPolling]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
          {lastUpdated && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Last updated <TimeAgo ts={lastUpdated} />
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => void refresh()}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </header>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {!stats && !error && <p>Loading…</p>}
      {stats && (
        <dl className="grid grid-cols-2 gap-4">
          <StatTile label="Pairs" value={stats.totalPairs} />
          <StatTile label="Status" value={stats.paused ? "Paused" : "Live"} />
        </dl>
      )}
    </main>
  );
}

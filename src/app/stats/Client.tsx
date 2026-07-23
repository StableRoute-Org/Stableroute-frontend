'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/useApi';
import { formatNumber, formatTimestamp } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { StatTile } from '@/components/StatTile';

type Stats = { totalPairs: number; paused: boolean };

/** Poll cadence for the stats dashboard (see ARCHITECTURE.md, "Data flow"). */
const POLL_MS = 5_000;
const LAST_UPDATED_TICK_MS = 1_000;

/** Format elapsed time for the stats freshness label. */
export function formatStatsAge(deltaMs: number): string {
  const elapsedSeconds = Math.max(0, Math.floor(deltaMs / 1_000));
  if (elapsedSeconds === 0) return 'just now';
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;

  return `${Math.floor(elapsedHours / 24)}d ago`;
}

function LastUpdated({ timestamp }: { timestamp: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), LAST_UPDATED_TICK_MS);
    return () => clearInterval(id);
  }, [timestamp]);

  return (
    <p className="mt-3 text-xs text-slate-500">
      Updated{' '}
      <time
        dateTime={new Date(timestamp).toISOString()}
        title={formatTimestamp(timestamp)}
      >
        {formatStatsAge(now - timestamp)}
      </time>
    </p>
  );
}

export type StatsSnapshotMetric = {
  label: string;
  value: number;
  display: string;
};

export type StatsSnapshot = {
  capturedAt: string;
  metrics: StatsSnapshotMetric[];
};

/** Pure builder: turns live stats into a serialisable, timestamped snapshot. */
export function buildStatsSnapshot(
  data: Stats,
  capturedAt: string = new Date().toISOString()
): StatsSnapshot {
  return {
    capturedAt,
    metrics: [
      {
        label: 'Pairs',
        value: data.totalPairs,
        display: formatNumber(data.totalPairs),
      },
      {
        label: 'Status',
        value: data.paused ? 1 : 0,
        display: data.paused ? 'Paused' : 'Live',
      },
    ],
  };
}

/** Pure serialiser: pretty-printed JSON for the snapshot. */
export function statsSnapshotToJson(snapshot: StatsSnapshot): string {
  return JSON.stringify(snapshot, null, 2);
}

function csvEscape(field: string): string {
  if (/["\n,]/.test(field)) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Pure serialiser: CSV with one row per metric, capturedAt repeated per row. */
export function statsSnapshotToCsv(snapshot: StatsSnapshot): string {
  const header = ['label', 'value', 'display', 'capturedAt'].join(',');
  const rows = snapshot.metrics.map((metric) =>
    [
      csvEscape(metric.label),
      String(metric.value),
      csvEscape(metric.display),
      snapshot.capturedAt,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

function triggerDownload(
  content: string,
  mimeType: string,
  filename: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** DOM download path for a stats snapshot, in either JSON or CSV form. */
export function downloadStatsSnapshot(
  data: Stats,
  format: 'json' | 'csv'
): void {
  const snapshot = buildStatsSnapshot(data);
  const safeTimestamp = snapshot.capturedAt.replace(/[:.]/g, '-');
  if (format === 'json') {
    triggerDownload(
      statsSnapshotToJson(snapshot),
      'application/json',
      `stats-snapshot-${safeTimestamp}.json`
    );
  } else {
    triggerDownload(
      statsSnapshotToCsv(snapshot),
      'text/csv',
      `stats-snapshot-${safeTimestamp}.csv`
    );
  }
}

export default function StatsClient() {
  const result = useApi<Stats>('/api/v1/stats');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const { refetch } = result;
  const status = result.status;
  const error = status === 'error' ? result.error : null;
  const data = status === 'success' ? result.data : null;

  useEffect(() => {
    const id = setInterval(refetch, POLL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    if (status === 'success' && data) setLastUpdatedAt(Date.now());
  }, [status, data]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {status === 'error' && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {status === 'loading' && (
        <div className="flex items-center gap-2 text-sm">
          <Spinner label="Loading stats" />
          Loading…
        </div>
      )}
      {status === 'success' && data && (
        <section aria-labelledby="stats-metrics-heading">
          <h2 id="stats-metrics-heading" className="sr-only">
            Router metrics
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <StatTile label="Pairs" value={formatNumber(data.totalPairs)} />
            <StatTile label="Status" value={data.paused ? 'Paused' : 'Live'} />
          </dl>
          {lastUpdatedAt !== null && <LastUpdated timestamp={lastUpdatedAt} />}
          <div className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadStatsSnapshot(data, 'json')}
            >
              Download JSON
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => downloadStatsSnapshot(data, 'csv')}
            >
              Download CSV
            </Button>
          </div>
        </section>
      )}
      {status === 'success' && data && data.totalPairs === 0 && (
        <EmptyState
          title="No pairs yet"
          description="Register a pair to see metrics."
        />
      )}
    </main>
  );
}

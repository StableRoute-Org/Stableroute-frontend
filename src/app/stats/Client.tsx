'use client';

import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/lib/useApi';
import { formatNumber, formatTimestamp } from '@/lib/format';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/Spinner';
import { StatTile } from '@/components/StatTile';
import { useToast } from '@/components/ToastProvider';
import { writeToClipboard } from '@/lib/clipboard';
import { isStats } from '@/lib/validate';

type Stats = { totalPairs: number; paused: boolean };

/** Poll cadence for the stats dashboard (see ARCHITECTURE.md, "Data flow"). */
const POLL_MS = 5_000;
const MAX_POLL_MS = 60_000;
const LAST_UPDATED_TICK_MS = 1_000;

type PollStatus = 'idle' | 'loading' | 'error' | 'success';
type TimeoutId = ReturnType<typeof setTimeout>;

export type BackoffIntervalOptions = {
  baseMs?: number;
  maxMs?: number;
  schedule?: (callback: () => void, delayMs: number) => TimeoutId;
  cancel?: (timeoutId: TimeoutId) => void;
};

const scheduleTimeout = (callback: () => void, delayMs: number) =>
  setTimeout(callback, delayMs);
const cancelTimeout = (timeoutId: TimeoutId) => clearTimeout(timeoutId);

/** Schedule the next poll after the current request settles. */
export function useBackoffInterval(
  status: PollStatus,
  callback: () => void,
  options: BackoffIntervalOptions = {}
): void {
  const {
    baseMs = POLL_MS,
    maxMs = MAX_POLL_MS,
    schedule = scheduleTimeout,
    cancel = cancelTimeout,
  } = options;
  const callbackRef = useRef(callback);
  const failureCountRef = useRef(0);
  callbackRef.current = callback;

  useEffect(() => {
    if (status !== 'success' && status !== 'error') return;

    if (status === 'success') {
      failureCountRef.current = 0;
    } else {
      failureCountRef.current += 1;
    }

    const delayMs =
      status === 'success'
        ? baseMs
        : Math.min(baseMs * 2 ** failureCountRef.current, maxMs);
    const timeoutId = schedule(() => callbackRef.current(), delayMs);
    return () => cancel(timeoutId);
  }, [baseMs, cancel, maxMs, schedule, status]);
}

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

/** Pure serialiser: concise plain text using the values shown in the UI. */
export function statsSnapshotToText(snapshot: StatsSnapshot): string {
  return [
    'StableRoute stats snapshot',
    ...snapshot.metrics.map((metric) => `${metric.label}: ${metric.display}`),
    `Captured: ${snapshot.capturedAt}`,
  ].join('\n');
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
  const { push } = useToast();
  const result = useApi<Stats>('/api/v1/stats', isStats);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const copyInFlightRef = useRef(false);
  const { refetch } = result;
  const status = result.status;
  const error = status === 'error' ? result.error : null;
  const data = status === 'success' ? result.data : null;

  useBackoffInterval(status, refetch);

  useEffect(() => {
    if (status === 'success' && data) setLastUpdatedAt(Date.now());
  }, [status, data]);

  const copyStatsSnapshot = async (stats: Stats) => {
    if (copyInFlightRef.current) return;
    copyInFlightRef.current = true;
    setIsCopying(true);
    try {
      const text = statsSnapshotToText(buildStatsSnapshot(stats));
      const copyResult = await writeToClipboard(text);
      if (copyResult.ok) {
        setCopyFallback(null);
        push('Stats snapshot copied.');
        return;
      }
      setCopyFallback(text);
      push(
        "Couldn't copy automatically. Select the snapshot below to copy it.",
        'error'
      );
    } finally {
      copyInFlightRef.current = false;
      setIsCopying(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {status === 'error' && (
        <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900 dark:bg-rose-950">
          <div role="alert">
            <h2 className="text-base font-medium text-rose-900 dark:text-rose-100">
              Unable to load stats
            </h2>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
              {error}
            </p>
            <p className="mt-2 text-sm text-rose-700 dark:text-rose-300">
              Retrying automatically with a longer delay while the service is
              unavailable.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={refetch}
          >
            Retry
          </Button>
        </section>
      )}
      <section
        aria-live="polite"
        aria-atomic="true"
        aria-busy={status === 'loading'}
        className="contents"
      >
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-sm">
            <Spinner label="Loading stats" />
            Loading…
          </div>
        )}
        {status === 'success' && data && data.totalPairs === 0 && (
          <EmptyState
            title="No stats available yet"
            description="Register a pair to start seeing router metrics."
          />
        )}
        {status === 'success' && data && data.totalPairs > 0 && (
          <section aria-labelledby="stats-metrics-heading">
            <h2 id="stats-metrics-heading" className="sr-only">
              Router metrics
            </h2>
            <dl className="grid grid-cols-2 gap-4">
              <StatTile label="Pairs" value={formatNumber(data.totalPairs)} />
              <StatTile
                label="Status"
                value={data.paused ? 'Paused' : 'Live'}
              />
            </dl>
            {lastUpdatedAt !== null && (
              <LastUpdated timestamp={lastUpdatedAt} />
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={isCopying}
                onClick={() => void copyStatsSnapshot(data)}
              >
                Copy stats snapshot
              </Button>
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
            {copyFallback !== null && (
              <label className="mt-4 block text-xs">
                <span className="mb-1 block">
                  Select and copy the stats snapshot:
                </span>
                <textarea
                  aria-label="Stats snapshot text"
                  readOnly
                  rows={4}
                  value={copyFallback}
                  onFocus={(event) => event.currentTarget.select()}
                  className="w-full resize-y rounded border border-neutral-300 px-2 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900"
                />
              </label>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

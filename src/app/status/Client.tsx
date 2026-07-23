'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '@/lib/apiClient';
import { getApiBase } from '@/lib/config';
import { TimeAgo } from '@/components/TimeAgo';
import { Spinner } from '@/components/Spinner';

type ProbeResult = {
  status: 'ok' | 'error';
  httpStatus: number | null;
  latencyMs: number | null;
  checkedAt: number;
};

export default function StatusClient() {
  const apiBase = getApiBase();
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [running, setRunning] = useState(false);

  const runProbe = useCallback(async () => {
    setRunning(true);
    const start = performance.now();
    try {
      await apiGet<unknown>('/api/v1/health', { timeoutMs: 5_000 });
      setProbe({
        status: 'ok',
        httpStatus: 200,
        latencyMs: performance.now() - start,
        checkedAt: Date.now(),
      });
    } catch (err: unknown) {
      const httpStatus =
        err && typeof err === 'object' && 'status' in err
          ? (err as { status: number }).status
          : null;
      setProbe({
        status: 'error',
        httpStatus,
        latencyMs: performance.now() - start,
        checkedAt: Date.now(),
      });
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    runProbe();
  }, [runProbe]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Status</h1>

      <section aria-labelledby="status-api-base-heading">
        <h2 id="status-api-base-heading" className="sr-only">
          API base URL
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Resolved API base:{' '}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
            {apiBase}
          </code>
        </p>
      </section>

      {!probe && running && (
        <div className="flex items-center gap-2 text-sm">
          <Spinner label="Probing API health" />
          Probing&hellip;
        </div>
      )}

      {probe && (
        <section aria-labelledby="status-results-heading">
          <h2 id="status-results-heading" className="sr-only">
            Probe results
          </h2>
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </dt>
              <dd
                className={`mt-1 text-2xl font-semibold ${
                  probe.status === 'ok'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {probe.status === 'ok' ? 'Reachable' : 'Unreachable'}
              </dd>
            </div>

            <div className="rounded-lg border p-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                HTTP Status
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {probe.httpStatus ?? '—'}
              </dd>
            </div>

            <div className="rounded-lg border p-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Latency
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                {probe.latencyMs !== null
                  ? `${probe.latencyMs.toFixed(0)} ms`
                  : '—'}
              </dd>
            </div>

            <div className="rounded-lg border p-4">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last checked
              </dt>
              <dd className="mt-1 text-2xl font-semibold">
                <TimeAgo ts={probe.checkedAt} />
              </dd>
            </div>
          </dl>
        </section>
      )}

      <div>
        <button
          type="button"
          onClick={runProbe}
          disabled={running}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50"
        >
          {running ? 'Probing\u2026' : 'Probe again'}
        </button>
      </div>
    </main>
  );
}

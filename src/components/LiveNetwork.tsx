'use client';

import { useEffect, useState } from 'react';
import {
  CONTRACT_EXPLORER_URL,
  CONTRACT_ID,
  STELLAR_NETWORK,
  getApiLinks,
  shortId,
} from '@/lib/site';

type Health = 'checking' | 'online' | 'offline';

/**
 * Live deployment panel: backend health (polled once on mount) plus the
 * deployed Soroban contract ID with a copy button and explorer link.
 */
export function LiveNetwork() {
  const api = getApiLinks();
  const [health, setHealth] = useState<Health>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    fetch(api.health, { cache: 'no-store' })
      .then((res) => {
        if (cancelled) return;
        setHealth(res.ok ? 'online' : 'offline');
        setLatency(Math.round(performance.now() - started));
      })
      .catch(() => {
        if (!cancelled) setHealth('offline');
      });
    return () => {
      cancelled = true;
    };
  }, [api.health]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ID);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const dot =
    health === 'online'
      ? 'bg-emerald-500'
      : health === 'offline'
        ? 'bg-rose-500'
        : 'bg-amber-400 animate-pulse';

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Routing API</p>
          <span className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 dark:text-neutral-300">
            <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
            {health === 'checking' ? 'Checking…' : health === 'online' ? `Online${latency !== null ? ` · ${latency} ms` : ''}` : 'Unreachable'}
          </span>
        </div>
        <p className="mt-3 break-all font-mono text-xs text-neutral-600 dark:text-neutral-400">{api.base}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <a className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800" href={api.docs} target="_blank" rel="noopener noreferrer">
            API docs ↗
          </a>
          <a className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800" href={api.health} target="_blank" rel="noopener noreferrer">
            /health ↗
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Router contract</p>
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            Stellar {STELLAR_NETWORK}
          </span>
        </div>
        <p className="mt-3 font-mono text-xs text-neutral-600 dark:text-neutral-400" title={CONTRACT_ID}>
          <span className="sm:hidden">{shortId(CONTRACT_ID, 10, 10)}</span>
          <span className="hidden break-all sm:inline">{CONTRACT_ID}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <button type="button" onClick={copy} className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
            {copied ? 'Copied!' : 'Copy ID'}
          </button>
          <a className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800" href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
            stellar.expert ↗
          </a>
        </div>
      </div>
    </div>
  );
}

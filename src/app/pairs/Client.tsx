'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/Badge';
import { ColumnVisibilityToggle } from '@/components/ColumnVisibilityToggle';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { PageHeading } from '@/components/PageHeading';
import { Spinner } from '@/components/Spinner';
import { useToast } from '@/components/ToastProvider';
import { apiDelete } from '@/lib/apiClient';
import { writeToClipboard } from '@/lib/clipboard';
import { useApi } from '@/lib/useApi';
import { useColumnVisibility } from '@/lib/useColumnVisibility';
import { filterPairs, groupBySource } from './pairsUtils';
import { type Pair } from '@/lib/types';

export default function PairsClient() {
  const { push } = useToast();
  const api = useApi<{ pairs: Pair[] }>('/api/v1/pairs');
  const [query, setQuery] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Pair | null>(null);
  const [copyingSymbol, setCopyingSymbol] = useState<string | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const { visibility, toggle, isColumnVisible } = useColumnVisibility();

  const pairs = api.status === 'success' ? api.data.pairs : null;

  // Keyed on [pairs, query]: only recomputes when the loaded rows or the
  // search text actually change, not on unrelated state (e.g. opening the
  // delete confirmation dialog).
  const filtered = useMemo(
    () => (pairs ? filterPairs(pairs, query) : null),
    [pairs, query]
  );

  // Grouping is a second, separate derivation from `filtered`. Without its own
  // memo it would still re-run on every render (e.g. toggling the delete
  // dialog) even though `filtered` itself was already stable.
  const grouped = useMemo(
    () => (filtered ? groupBySource(filtered) : []),
    [filtered]
  );

  const copyPairSymbol = async (symbol: string) => {
    setCopyingSymbol(symbol);
    try {
      const result = await writeToClipboard(symbol);
      if (result.ok) {
        setCopyFallback(null);
        push(`Copied ${symbol}.`);
        return;
      }
      setCopyFallback(symbol);
      push(
        `Couldn't copy ${symbol} automatically. Select it below to copy it.`,
        'error'
      );
    } finally {
      setCopyingSymbol(null);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8"
    >
      <PageHeading
        title={
          <span className="flex items-center gap-2">
            Pairs
            {pairs !== null && (
              <Badge variant="neutral">
                {pairs.length} pair{pairs.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </span>
        }
        description="Registered routing pairs for the StableRoute router."
        action={
          <Link
            href="/pairs/new"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
          >
            New pair
          </Link>
        }
      />
      <div className="flex items-end gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span>Filter pairs</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by asset code"
            className="rounded-md border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <ColumnVisibilityToggle visibility={visibility} onToggle={toggle} />
      </div>
      {api.status === 'error' && (
        <p role="alert" className="text-sm text-rose-600">
          {api.error}
        </p>
      )}
      <section
        aria-live="polite"
        aria-busy={api.status === 'loading'}
        className="contents"
      >
        {api.status === 'loading' && (
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Spinner label="Loading pairs" />
            Loading…
          </div>
        )}
        {filtered && filtered.length === 0 && pairs && pairs.length === 0 && (
          <EmptyState
            title="No pairs registered yet"
            description="Create your first source→destination routing pair."
          />
        )}
        {filtered && filtered.length === 0 && pairs && pairs.length > 0 && (
          <EmptyState
            title="No pairs found"
            description="Try a different filter or register a new pair."
          />
        )}
        {filtered && filtered.length > 0 && (
          <div className="flex flex-col gap-6">
            {grouped.map(([source, destinations]) => (
              <section key={source}>
                {isColumnVisible('source') && (
                  <h2 className="mb-2 text-lg font-semibold tracking-tight">
                    {source}
                  </h2>
                )}
                <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                  {destinations.map((dest) => (
                    <li key={`${source}::${dest}`} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        {isColumnVisible('destination') && (
                          <span className="font-mono text-sm">{dest}</span>
                        )}
                        {isColumnVisible('source') &&
                          !isColumnVisible('destination') && (
                            <span className="font-mono text-sm">{source}</span>
                          )}
                        {!isColumnVisible('source') &&
                          !isColumnVisible('destination') && (
                            <span className="font-mono text-sm">
                              {source}/{dest}
                            </span>
                          )}
                        {isColumnVisible('actions') && (
                          <div className="flex gap-2">
                            <Link
                              href={`/quote?source=${encodeURIComponent(source)}&dest=${encodeURIComponent(dest)}`}
                              className="rounded border px-3 py-1 text-xs dark:border-neutral-700"
                            >
                              Quote
                            </Link>
                            <button
                              type="button"
                              aria-label={`Copy pair symbol ${source}/${dest}`}
                              disabled={copyingSymbol === `${source}/${dest}`}
                              onClick={() =>
                                void copyPairSymbol(`${source}/${dest}`)
                              }
                              className="rounded border px-3 py-1 text-xs disabled:opacity-50 dark:border-neutral-700"
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({ source, destination: dest })
                              }
                              className="rounded border px-3 py-1 text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      {copyFallback === `${source}/${dest}` && (
                        <label className="mt-3 block text-xs">
                          <span className="mb-1 block">
                            Select and copy the pair symbol:
                          </span>
                          <textarea
                            aria-label={`Pair symbol ${source}/${dest}`}
                            readOnly
                            rows={1}
                            value={`${source}/${dest}`}
                            onFocus={(event) => event.currentTarget.select()}
                            className="w-full resize-none rounded border border-neutral-300 px-2 py-1 font-mono dark:border-neutral-700 dark:bg-neutral-900"
                          />
                        </label>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Delete pair?"
        confirmLabel="Delete"
        onConfirm={() => {
          if (!pendingDelete) return;
          const target = pendingDelete;
          setPendingDelete(null);
          void apiDelete(
            `/api/v1/pairs/${encodeURIComponent(target.source)}/${encodeURIComponent(target.destination)}`
          ).then(() => api.refetch());
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </main>
  );
}

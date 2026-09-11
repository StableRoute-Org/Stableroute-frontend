'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TextField } from '@/components/TextField';
import { SlippageView } from './Slippage';
import { apiFetch, type ApiError } from '@/lib/apiClient';
import { formatQuoteAmountDisplay, formatQuoteRateDisplay } from '@/lib/format';
import { useFormAnnouncement } from '@/lib/useFormAnnouncement';
import { useLocalStorage } from '@/lib/useLocalStorage';
import type { Quote } from '@/lib/types';
import { isQuote } from '@/lib/validate';
import {
  QuoteHistory,
  type HistoryEntry,
  type QuoteInputs,
} from './QuoteHistory';
import {
  canonicalEntryFromQuote,
  mergePendingEntry,
  pushHistoryPure,
  readHistory,
  writeHistory,
  type PendingHistoryEntry,
} from './historyModel';
import { useOfflineQueue } from './useOfflineQueue';
import { type QueuedSwapMutation } from './offlineQueueModel';

type FieldErrors = {
  source?: string;
  dest?: string;
  amount?: string;
};

const INPUTS_KEY = 'stableroute.quote.inputs';
const ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;
const MIN_SUBMIT_INTERVAL_MS = 1_000;
const ROLLBACK_MESSAGE =
  'The recent quotes update failed and was rolled back.';

function normalizeAssetCode(value: string): string | null {
  const trimmed = value.trim();
  return ASSET_CODE_PATTERN.test(trimmed) ? trimmed : null;
}

function isValidAmount(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

function isQuoteInputs(value: unknown): value is QuoteInputs {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as QuoteInputs).source === 'string' &&
    typeof (value as QuoteInputs).dest === 'string' &&
    typeof (value as QuoteInputs).amount === 'string'
  );
}

function pushHistory(entry: QuoteInputs): HistoryEntry[] {
  // Confirmed writes only — optimistic entries never reach localStorage.
  return writeHistory(pushHistoryPure(readHistory(), entry));
}

export default function QuoteClient() {
  const [savedInputs, setSavedInputs] = useLocalStorage<QuoteInputs | null>(
    INPUTS_KEY,
    null,
    isQuoteInputs
  );
  const [sourceAsset, setSourceAsset] = useState('');
  const [destAsset, setDestAsset] = useState('');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [pendingEntry, setPendingEntry] = useState<PendingHistoryEntry | null>(
    null
  );
  const [quote, setQuote] = useState<Quote | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { message: formStatus, announce } = useFormAnnouncement();
  const [slippageAnnouncement, setSlippageAnnouncement] = useState('');
  const activeRequestRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const lastSubmitAtRef = useRef<number | null>(null);
  const lastAnnounceAtRef = useRef(0);

  const handleFlushItem = useCallback(
    async (item: QueuedSwapMutation) => {
      const normSource = normalizeAssetCode(item.source);
      const normDest = normalizeAssetCode(item.dest);
      if (!normSource || !normDest || !isValidAmount(item.amount)) {
        return {
          success: false,
          conflictReason: 'Invalid queued mutation parameters',
        };
      }
      try {
        const path =
          `/api/v1/quote?source_asset=${encodeURIComponent(normSource)}` +
          `&dest_asset=${encodeURIComponent(normDest)}` +
          `&amount=${encodeURIComponent(item.amount.trim())}`;
        const body = await apiFetch<Quote>(path, {}, { validate: isQuote });
        setQuote(body);
        setHistory(pushHistory(canonicalEntryFromQuote(body)));
        announce(
          `Reconciled offline quote for ${body.source_asset} → ${body.dest_asset}.`
        );
        return { success: true, result: body };
      } catch (err: any) {
        const apiError = err as ApiError;
        return {
          success: false,
          conflictReason: apiError.message ?? 'Server rejected quote',
        };
      }
    },
    [announce]
  );

  const {
    isOffline,
    queue: offlineQueue,
    isFlushing: isOfflineFlushing,
    conflicts: offlineConflicts,
    enqueueMutation,
    clearConflict,
  } = useOfflineQueue({
    onFlushItem: handleFlushItem,
  });

  // Prefill once storage has synced client-side (see useLocalStorage's SSR
  // handling). Re-running only when the stored value actually changes avoids
  // clobbering in-progress edits.
  useEffect(() => {
    if (savedInputs) {
      setSourceAsset(savedInputs.source);
      setDestAsset(savedInputs.dest);
      setAmount(savedInputs.amount);
    }
  }, [savedInputs]);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  const applyInputs = useCallback((inputs: QuoteInputs) => {
    setSourceAsset(inputs.source);
    setDestAsset(inputs.dest);
    setAmount(inputs.amount);
    setFieldErrors({});
    setFormError(null);
    setQuote(null);
  }, []);

  const swapAssets = () => {
    setSourceAsset(destAsset);
    setDestAsset(sourceAsset);
    setFieldErrors((current) => ({
      ...current,
      source: undefined,
      dest: undefined,
    }));
  };

  const executeQuoteRequest = useCallback(async () => {
    const now = Date.now();
    const lastSubmitAt = lastSubmitAtRef.current;
    const isCoolingDown =
      lastSubmitAt !== null && now - lastSubmitAt < MIN_SUBMIT_INTERVAL_MS;

    if (isCoolingDown) {
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setRequestId(null);
    setQuote(null);
    setSlippageAnnouncement('');

    const nextErrors: FieldErrors = {};
    const normalizedSource = normalizeAssetCode(sourceAsset);
    const normalizedDest = normalizeAssetCode(destAsset);

    if (!normalizedSource) nextErrors.source = 'Use 1-12 letters or numbers.';
    if (!normalizedDest) nextErrors.dest = 'Use 1-12 letters or numbers.';
    if (!isValidAmount(amount)) {
      nextErrors.amount = 'Amount must be a positive integer (base units).';
    }
    if (
      normalizedSource &&
      normalizedDest &&
      normalizedSource === normalizedDest
    ) {
      nextErrors.dest = 'Source and destination assets must differ.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }
    if (!normalizedSource || !normalizedDest || !isValidAmount(amount)) return;

    const inputs = {
      source: sourceAsset,
      dest: destAsset,
      amount: amount.trim(),
    };
    setSavedInputs(inputs);

    // If offline: queue mutation and provide feedback without attempting network call (#729)
    if (isOffline) {
      enqueueMutation(inputs);
      announce('Offline: quote request queued.');
      return;
    }

    lastSubmitAtRef.current = now;
    if (requestControllerRef.current) {
      requestControllerRef.current.abort();
    }

    const controller = new AbortController();
    requestControllerRef.current = controller;
    const currentRequestId = activeRequestRef.current + 1;
    activeRequestRef.current = currentRequestId;

    // Optimistic mutation (#723): reflect the requested quote in Recent
    // quotes before the server responds. Rendered via mergePendingEntry and
    // never persisted; reconciled or rolled back when the request settles.
    // A newer submission overwrites this single slot, implicitly discarding
    // the stale one.
    setPendingEntry({
      ...inputs,
      savedAt: now,
      key: `pending-${currentRequestId}`,
    });

    setLoading(true);
    announce('Requesting quote…');
    try {
      const path =
        `/api/v1/quote?source_asset=${encodeURIComponent(normalizedSource)}` +
        `&dest_asset=${encodeURIComponent(normalizedDest)}` +
        `&amount=${encodeURIComponent(inputs.amount)}`;
      const body = await apiFetch<Quote>(
        path,
        { signal: controller.signal },
        { validate: isQuote }
      );
      if (currentRequestId !== activeRequestRef.current) return;
      setQuote(body);
      // Reconcile (#723): the confirmed entry built from the server's
      // response fields replaces the optimistic row; only now is anything
      // written to localStorage.
      setHistory(pushHistory(canonicalEntryFromQuote(body)));
      setPendingEntry(null);
      announce('Quote received.');
      const rateDisplay = formatQuoteRateDisplay(body.estimated_rate).display;
      const now = Date.now();
      if (now - lastAnnounceAtRef.current >= 300) {
        lastAnnounceAtRef.current = now;
        setSlippageAnnouncement(
          `Quote received: ${body.source_asset} → ${body.dest_asset} at estimated rate ${rateDisplay}`
        );
      }
    } catch (err) {
      if (currentRequestId !== activeRequestRef.current) return;
      if (controller.signal.aborted) return;
      // Roll back (#723): drop the optimistic row so the rendered history is
      // exactly what it was before the submission. Only this slot is
      // cleared — unrelated state (form fields, confirmed rows, storage)
      // was never touched by the mutation.
      setPendingEntry(null);
      const apiError = err as ApiError & { requestId?: string };
      setFormError(apiError.message ?? 'quote request failed');
      setRequestId(apiError.requestId ?? null);
      announce(ROLLBACK_MESSAGE);
      const failTime = Date.now();
      if (failTime - lastAnnounceAtRef.current >= 300) {
        lastAnnounceAtRef.current = failTime;
        setSlippageAnnouncement(
          `Quote request failed: ${apiError.message ?? 'quote request failed'}`
        );
      }
    } finally {
      if (currentRequestId === activeRequestRef.current) {
        setLoading(false);
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
      }
    }
  }, [amount, destAsset, setSavedInputs, sourceAsset, announce, isOffline, enqueueMutation]);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      executeQuoteRequest();
    },
    [executeQuoteRequest]
  );

  // Retry wrapper for the quote request – re‑uses the existing submission logic.
  const retryQuote = useCallback(() => {
    // Create a synthetic submit event to trigger the same validation & request flow.
    // The event type is cast to any to satisfy the FormEvent generic.
    onSubmit(new Event('submit') as any);
  }, [onSubmit]);

  // Stable identity across unrelated re-renders keeps QuoteHistory's memo
  // effective; the pending entry (if any) leads the rendered rows.
  const historyView = useMemo(
    () => mergePendingEntry(history, pendingEntry),
    [history, pendingEntry]
  );

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 p-8 focus:outline-none"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Get a quote</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Request a routing quote for a (source, destination, amount) triple.
        </p>
      </header>

      {/* Offline Status Indicator (#729) */}
      {isOffline && (
        <div
          role="status"
          aria-live="polite"
          data-testid="offline-indicator"
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <p className="font-semibold">You are currently offline.</p>
          <p className="mt-1">
            Swap requests are queued locally and will be reconciled when you reconnect.
          </p>
        </div>
      )}

      {/* Flushing Reconnect Indicator (#729) */}
      {isOfflineFlushing && (
        <div
          role="status"
          aria-live="polite"
          data-testid="flushing-indicator"
          className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200"
        >
          Reconnected to network. Reconciling queued swap mutations in order…
        </div>
      )}

      {/* Offline Reconciliation Conflicts (#729) */}
      {offlineConflicts.length > 0 && (
        <div
          role="alert"
          data-testid="conflict-alert"
          className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <h3 className="font-semibold">Reconciliation Conflicts:</h3>
          <ul className="flex flex-col gap-2">
            {offlineConflicts.map((c) => (
              <li
                key={c.id}
                data-testid={`conflict-item-${c.id}`}
                className="flex items-center justify-between gap-2"
              >
                <span>
                  {c.source} → {c.dest} ({c.amount}): {c.reason}
                </span>
                <button
                  type="button"
                  onClick={() => clearConflict(c.id)}
                  aria-label={`Dismiss conflict for ${c.source} to ${c.dest}`}
                  className="rounded border border-rose-300 px-2 py-0.5 text-xs hover:bg-rose-100 dark:border-rose-700 dark:hover:bg-rose-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"
                >
                  Dismiss
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Offline Queued Mutations List (#729) */}
      {offlineQueue.length > 0 && (
        <section
          aria-label="Offline queued mutations"
          data-testid="offline-queue-section"
          className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/50"
        >
          <h3 className="font-medium text-neutral-700 dark:text-neutral-300">
            Offline Queued Mutations ({offlineQueue.length})
          </h3>
          <ul className="flex flex-col gap-1.5">
            {offlineQueue.map((item) => (
              <li
                key={item.id}
                data-testid={`queued-row-${item.id}`}
                className="flex items-center justify-between rounded border border-neutral-200 bg-white px-3 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-950"
              >
                <span className="font-mono">
                  {item.source} → {item.dest} · {item.amount}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    item.status === 'conflict'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : item.status === 'flushing'
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <QuoteHistory
        history={historyView}
        hasPendingEntry={pendingEntry !== null}
        onSelect={applyInputs}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Source asset"
          name="source_asset"
          value={sourceAsset}
          onChange={(e) => setSourceAsset(e.target.value)}
          maxLength={12}
          placeholder="USDC"
          error={fieldErrors.source}
          aria-invalid={fieldErrors.source ? true : undefined}
        />
        <button
          type="button"
          onClick={swapAssets}
          aria-label="Swap source and destination assets"
          className="self-center rounded-full border border-neutral-300 px-3 py-1 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:border-neutral-700"
        >
          Swap ⇄
        </button>
        <TextField
          label="Destination asset"
          name="dest_asset"
          value={destAsset}
          onChange={(e) => setDestAsset(e.target.value)}
          maxLength={12}
          placeholder="EURC"
          error={fieldErrors.dest}
          aria-invalid={fieldErrors.dest ? true : undefined}
        />
        <TextField
          label="Amount (base units)"
          name="amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="1000000"
          error={fieldErrors.amount}
          aria-invalid={fieldErrors.amount ? true : undefined}
        />
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]"
        >
          {loading ? 'Quoting…' : 'Get quote'}
        </button>
        <p aria-live="polite" className="sr-only">
          {formStatus}
        </p>
      </form>

      {quote &&
        (() => {
          const amountFmt = formatQuoteAmountDisplay(quote.amount);
          const rateFmt = formatQuoteRateDisplay(quote.estimated_rate);
          return (
            <section
              role="status"
              aria-live="polite"
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950"
            >
              <dl className="grid gap-2">
                <div>
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                    Route
                  </dt>
                  <dd>{quote.route.join(' → ')}</dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                    Amount
                  </dt>
                  <dd title={amountFmt.title}>{amountFmt.display}</dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                    Estimated rate
                  </dt>
                  <dd title={rateFmt.title}>{rateFmt.display}</dd>
                </div>
              </dl>
            </section>
          );
        })()}
      {/* Slippage status UI */}
      <SlippageView
        status={
          loading
            ? 'loading'
            : formError
              ? 'error'
              : quote
                ? 'success'
                : 'empty'
        }
        slippage={
          quote
            ? `${((Number(quote.estimated_rate) - 1) * 100).toFixed(2)}%`
            : undefined
        }
        errorMessage={formError ?? undefined}
        onRetry={formError ? retryQuote : undefined}
      />
      {formError && (
        <div role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          <p>{formError}</p>
          {requestId && (
            <p className="mt-1 text-xs">
              Request ID: <code>{requestId}</code>
            </p>
          )}
        </div>
      )}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {slippageAnnouncement}
      </div>
    </main>
  );
}

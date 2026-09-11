'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { TextField } from '@/components/TextField';
import { SlippageView } from './Slippage';
import { SwapResultView } from './SwapResultView';
import {
  swapAsyncReducer,
  INITIAL_SWAP_STATE,
  formatSwapError,
} from './swapStateMachine';
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [swapState, dispatchSwap] = useReducer(
    swapAsyncReducer,
    INITIAL_SWAP_STATE
  );
  const loading = swapState.status === 'loading';
  const { message: formStatus, announce } = useFormAnnouncement();
  const [slippageAnnouncement, setSlippageAnnouncement] = useState('');
  const activeRequestRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const lastSubmitAtRef = useRef<number | null>(null);
  const lastAnnounceAtRef = useRef(0);

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
    dispatchSwap({ type: 'RESET' });
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

  const executeQuoteRequest = useCallback(
    async (options?: { bypassCooldown?: boolean }) => {
      const now = Date.now();
      const lastSubmitAt = lastSubmitAtRef.current;
      const isCoolingDown =
        !options?.bypassCooldown &&
        lastSubmitAt !== null &&
        now - lastSubmitAt < MIN_SUBMIT_INTERVAL_MS;

      if (isCoolingDown) {
        return;
      }

    setFieldErrors({});
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

    dispatchSwap({ type: 'SUBMIT_START' });
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
      dispatchSwap({ type: 'SUBMIT_SUCCESS', quote: body });
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
      const { message, requestId } = formatSwapError(err);
      dispatchSwap({ type: 'SUBMIT_ERROR', message, requestId });
      announce(ROLLBACK_MESSAGE);
      const failTime = Date.now();
      if (failTime - lastAnnounceAtRef.current >= 300) {
        lastAnnounceAtRef.current = failTime;
        setSlippageAnnouncement(
          `Quote request failed: ${message}`
        );
      }
    } finally {
      if (currentRequestId === activeRequestRef.current) {
        if (requestControllerRef.current === controller) {
          requestControllerRef.current = null;
        }
      }
    }
  }, [amount, destAsset, setSavedInputs, sourceAsset, announce]);

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      executeQuoteRequest();
    },
    [executeQuoteRequest]
  );

  // Retry wrapper for the quote request – re‑uses the existing submission logic.
  const retryQuote = useCallback(() => {
    executeQuoteRequest({ bypassCooldown: true });
  }, [executeQuoteRequest]);

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

      <SwapResultView state={swapState} onRetry={retryQuote} />
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {slippageAnnouncement}
      </div>
    </main>
  );
}

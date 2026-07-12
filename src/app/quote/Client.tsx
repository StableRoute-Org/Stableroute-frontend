"use client";

import { useEffect, useState } from "react";
import { TextField } from "@/components/TextField";
import type { ApiError } from "@/lib/apiClient";
import { getApiBase } from "@/lib/config";
import { formatQuoteAmountDisplay, formatQuoteRateDisplay } from "@/lib/format";

type Quote = {
  source_asset: string;
  dest_asset: string;
  amount: string;
  estimated_rate: string;
  route: string[];
};

type FieldErrors = {
  source?: string;
  dest?: string;
  amount?: string;
};

type QuoteInputs = {
  source: string;
  dest: string;
  amount: string;
};

type HistoryEntry = QuoteInputs & { savedAt: number };

const INPUTS_KEY = "stableroute.quote.inputs";
const HISTORY_KEY = "stableroute.quote.history";
const MAX_HISTORY = 5;
const ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

function normalizeAssetCode(value: string): string | null {
  const trimmed = value.trim();
  return ASSET_CODE_PATTERN.test(trimmed) ? trimmed : null;
}

function isValidAmount(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

function readInputs(): QuoteInputs | null {
  try {
    const raw = localStorage.getItem(INPUTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QuoteInputs;
    if (
      typeof parsed.source === "string" &&
      typeof parsed.dest === "string" &&
      typeof parsed.amount === "string"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function pushHistory(entry: QuoteInputs) {
  const next: HistoryEntry[] = [
    { ...entry, savedAt: Date.now() },
    ...readHistory().filter(
      (item) =>
        item.source !== entry.source ||
        item.dest !== entry.dest ||
        item.amount !== entry.amount,
    ),
  ].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export default function QuoteClient() {
  const [sourceAsset, setSourceAsset] = useState("");
  const [destAsset, setDestAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = readInputs();
    if (saved) {
      setSourceAsset(saved.source);
      setDestAsset(saved.dest);
      setAmount(saved.amount);
    }
    setHistory(readHistory());
  }, []);

  const applyInputs = (inputs: QuoteInputs) => {
    setSourceAsset(inputs.source);
    setDestAsset(inputs.dest);
    setAmount(inputs.amount);
    setFieldErrors({});
    setFormError(null);
    setQuote(null);
  };

  const swapAssets = () => {
    setSourceAsset(destAsset);
    setDestAsset(sourceAsset);
    setFieldErrors((current) => ({
      ...current,
      source: undefined,
      dest: undefined,
    }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setRequestId(null);
    setQuote(null);

    const nextErrors: FieldErrors = {};
    const normalizedSource = normalizeAssetCode(sourceAsset);
    const normalizedDest = normalizeAssetCode(destAsset);

    if (!normalizedSource) nextErrors.source = "Use 1-12 letters or numbers.";
    if (!normalizedDest) nextErrors.dest = "Use 1-12 letters or numbers.";
    if (!isValidAmount(amount)) {
      nextErrors.amount = "Amount must be a positive integer (base units).";
    }
    if (normalizedSource && normalizedDest && normalizedSource === normalizedDest) {
      nextErrors.dest = "Source and destination assets must differ.";
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
    localStorage.setItem(INPUTS_KEY, JSON.stringify(inputs));

    setLoading(true);
    try {
      const url = `${getApiBase()}/api/v1/quote?source_asset=${encodeURIComponent(normalizedSource)}&dest_asset=${encodeURIComponent(normalizedDest)}&amount=${encodeURIComponent(inputs.amount)}`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) {
        const apiError = body as ApiError | undefined;
        setFormError(apiError?.message ?? "quote request failed");
        setRequestId(apiError?.requestId ?? null);
        return;
      }
      setQuote(body as Quote);
      setHistory(pushHistory(inputs));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "network error");
    } finally {
      setLoading(false);
    }
  };

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

      {history.length > 0 && (
        <section aria-labelledby="recent-quotes-heading" className="flex flex-col gap-2">
          <h2 id="recent-quotes-heading" className="text-sm font-medium">
            Recent quotes
          </h2>
          <ul className="flex flex-col gap-1">
            {history.map((entry) => (
              <li key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}>
                <button
                  type="button"
                  onClick={() => applyInputs(entry)}
                  className="w-full rounded border border-neutral-200 px-3 py-2 text-left text-sm hover:border-neutral-400 dark:border-neutral-800"
                >
                  {entry.source} → {entry.dest} · {entry.amount}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

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
          className="self-center rounded-full border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
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
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Quoting…" : "Get quote"}
        </button>
      </form>

      {quote && (() => {
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
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">Route</dt>
                <dd>{quote.route.join(" → ")}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">Amount</dt>
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
    </main>
  );
}

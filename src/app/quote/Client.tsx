"use client";

import { useState } from "react";
import { TextField } from "@/components/TextField";
import type { ApiError } from "@/lib/apiClient";
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

const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";
const ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

/** Returns a trimmed Stellar asset code when it is safe to send to the quote API. */
function normalizeAssetCode(value: string): string | null {
  const trimmed = value.trim();
  return ASSET_CODE_PATTERN.test(trimmed) ? trimmed : null;
}

function isValidAmount(value: string): boolean {
  const trimmed = value.trim();
  return /^[1-9]\d*$/.test(trimmed);
}

export default function QuoteClient() {
  const [sourceAsset, setSourceAsset] = useState("");
  const [destAsset, setDestAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    setRequestId(null);
    setQuote(null);

    const nextErrors: FieldErrors = {};
    const normalizedSource = normalizeAssetCode(sourceAsset);
    const normalizedDest = normalizeAssetCode(destAsset);
    const normalizedAmount = amount.trim();

    if (!normalizedSource) {
      nextErrors.source = "Use 1-12 letters or numbers.";
    }
    if (!normalizedDest) {
      nextErrors.dest = "Use 1-12 letters or numbers.";
    }
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

    if (!normalizedSource || !normalizedDest || !isValidAmount(amount)) {
      return;
    }

    setLoading(true);
    try {
      const url = `${API_BASE}/api/v1/quote?source_asset=${encodeURIComponent(normalizedSource)}&dest_asset=${encodeURIComponent(normalizedDest)}&amount=${encodeURIComponent(normalizedAmount)}`;
      const res = await fetch(url);
      const body = await res.json();
      if (!res.ok) {
        const apiError = body as ApiError | undefined;
        setFormError(apiError?.message ?? "quote request failed");
        setRequestId(apiError?.requestId ?? null);
        return;
      }
      setQuote(body as Quote);
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
          Amount is expressed in base units (1 USDC = 10⁷ stroops).
        </p>
      </header>

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
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="font-medium">Route: {quote.route.join(" → ")}</p>
            <p title={amountFmt.title}>Amount: {amountFmt.display}</p>
            <p title={rateFmt.title}>Estimated rate: {rateFmt.display}</p>
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

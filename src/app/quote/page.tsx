"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { apiGet, type ApiError } from "@/lib/apiClient";

type Quote = {
  source_asset: string;
  dest_asset: string;
  amount: string;
  estimated_rate: string;
  route: string[];
};

export default function QuotePage() {
  const toast = useToast();
  const [sourceAsset, setSourceAsset] = useState("");
  const [destAsset, setDestAsset] = useState("");
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setQuote(null);

    if (sourceAsset === destAsset) {
      setError("Source and destination assets must differ.");
      return;
    }
    if (!/^[1-9][0-9]{0,38}$/.test(amount)) {
      setError("Amount must be a positive integer (base units).");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        source_asset: sourceAsset,
        dest_asset: destAsset,
        amount,
      });
      const body = await apiGet<Quote>(`/api/v1/quote?${params.toString()}`);
      setQuote(body);
      toast.push(`Quote ready for ${body.source_asset} → ${body.dest_asset}`);
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      const message =
        apiError.message ||
        (err instanceof Error && err.message ? err.message : "quote request failed");
      setError(message);
      toast.push(message, "error");
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
        <label className="flex flex-col gap-1 text-sm">
          <span>Source asset</span>
          <input
            required
            name="source_asset"
            value={sourceAsset}
            onChange={(e) => setSourceAsset(e.target.value)}
            maxLength={12}
            placeholder="USDC"
            className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Destination asset</span>
          <input
            required
            name="dest_asset"
            value={destAsset}
            onChange={(e) => setDestAsset(e.target.value)}
            maxLength={12}
            placeholder="EURC"
            className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Amount (base units)</span>
          <input
            required
            name="amount"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000000"
            className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Quoting…" : "Get quote"}
        </button>
      </form>

      {quote && (
        <section
          role="status"
          aria-live="polite"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950"
        >
          <p className="font-medium">Route: {quote.route.join(" → ")}</p>
          <p>Amount: {quote.amount}</p>
          <p>Estimated rate: {quote.estimated_rate}</p>
        </section>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
          {error}
        </p>
      )}
    </main>
  );
}

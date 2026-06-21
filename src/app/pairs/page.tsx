"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { useToast } from "@/components/ToastProvider";
import { apiGet, apiPatch } from "@/lib/apiClient";

type Pair = { source: string; destination: string; fee_bps?: number };

const MAX_FEE_BPS = 1000;
const pairKey = (pair: Pair) => `${pair.source}::${pair.destination}`;

function parseFeeBps(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const fee = Number(value);
  return fee <= MAX_FEE_BPS ? fee : null;
}

export default function PairsPage() {
  const toast = useToast();
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [draftFees, setDraftFees] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPairs = useCallback(
    () =>
      apiGet<{ pairs: Pair[] }>("/api/v1/pairs").then((b) => {
        setPairs(b.pairs);
        setDraftFees(
          Object.fromEntries(
            b.pairs.map((pair) => [pairKey(pair), String(pair.fee_bps ?? 0)])
          )
        );
      }),
    []
  );

  useEffect(() => {
    loadPairs().catch((e) => setError(e.message));
  }, [loadPairs]);

  const saveFee = async (pair: Pair) => {
    const key = pairKey(pair);
    const fee = parseFeeBps(draftFees[key] ?? "");
    if (fee === null) {
      setRowErrors((current) => ({
        ...current,
        [key]: `Fee must be an integer between 0 and ${MAX_FEE_BPS} bps.`,
      }));
      return;
    }

    const previousFee = pair.fee_bps ?? 0;
    setRowErrors((current) => ({ ...current, [key]: "" }));
    setSavingKey(key);
    setPairs(
      (current) =>
        current?.map((item) =>
          pairKey(item) === key ? { ...item, fee_bps: fee } : item
        ) ?? null
    );

    try {
      const updated = await apiPatch<Pair>(
        `/api/v1/pairs/${encodeURIComponent(pair.source)}/${encodeURIComponent(
          pair.destination
        )}/fee_bps`,
        { fee_bps: fee }
      );
      const savedFee = updated.fee_bps ?? fee;
      setPairs((current) =>
        current?.map((item) =>
          pairKey(item) === key ? { ...item, fee_bps: savedFee } : item
        ) ?? null
      );
      setDraftFees((current) => ({ ...current, [key]: String(savedFee) }));
      toast.push(`Saved ${pair.source} → ${pair.destination} fee`);
    } catch (err) {
      setPairs((current) =>
        current?.map((item) =>
          pairKey(item) === key ? { ...item, fee_bps: previousFee } : item
        ) ?? null
      );
      setDraftFees((current) => ({ ...current, [key]: String(previousFee) }));
      setRowErrors((current) => ({
        ...current,
        [key]: (err as Error).message,
      }));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <header className="flex items-baseline justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Pairs</h1>
        <Link
          href="/pairs/new"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          New pair
        </Link>
      </header>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {!pairs && !error && <p>Loading…</p>}
      {pairs && pairs.length === 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No pairs registered yet.
        </p>
      )}
      {pairs && pairs.length > 0 && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {pairs.map((p) => (
            <li key={pairKey(p)} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="font-mono text-sm">
                  {p.source} → {p.destination}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  Current fee: {p.fee_bps ?? 0} bps
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:min-w-64">
                <div className="flex items-start gap-2">
                  <TextField
                    label="Fee bps"
                    aria-label={`Fee bps for ${p.source} to ${p.destination}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={MAX_FEE_BPS}
                    step={1}
                    value={draftFees[pairKey(p)] ?? String(p.fee_bps ?? 0)}
                    onChange={(e) => {
                      const key = pairKey(p);
                      setDraftFees((current) => ({
                        ...current,
                        [key]: e.target.value,
                      }));
                      setRowErrors((current) => ({ ...current, [key]: "" }));
                    }}
                    error={rowErrors[pairKey(p)]}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    aria-label={`Save fee for ${p.source} to ${p.destination}`}
                    disabled={savingKey === pairKey(p)}
                    onClick={() => saveFee(p)}
                    className="mt-6 px-4"
                  >
                    {savingKey === pairKey(p) ? "Saving…" : "Save"}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

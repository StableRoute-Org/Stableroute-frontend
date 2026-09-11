'use client';

import React from 'react';
import { formatQuoteAmountDisplay, formatQuoteRateDisplay } from '@/lib/format';
import { Spinner } from '@/components/Spinner';
import { SlippageView } from './Slippage';
import type { SwapAsyncState } from './swapStateMachine';

export interface SwapResultViewProps {
  state: SwapAsyncState;
  onRetry?: () => void;
}

/**
 * Renders mutually exclusive view states for the swap interface:
 * - loading: shows loader only with assistive tech announcement.
 * - empty: shows empty state placeholder only.
 * - error: shows error alert and retry button only.
 * - success: shows route, amount, rate, and slippage data only.
 *
 * Guaranteed by construction: no state can render behind another.
 */
export function SwapResultView({ state, onRetry }: SwapResultViewProps) {
  switch (state.status) {
    case 'loading':
      return (
        <section
          data-testid="swap-loading"
          role="status"
          aria-label="Requesting quote…"
          aria-live="polite"
          aria-busy="true"
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/50 p-8 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400"
        >
          <Spinner label="Requesting quote…" />
          <p className="text-sm font-medium">Finding optimal route…</p>
        </section>
      );

    case 'empty':
      return (
        <section
          data-testid="swap-empty"
          className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
        >
          <p className="font-medium">No quote requested yet.</p>
          <p className="mt-1 text-xs">
            Enter source, destination, and amount above to calculate route and rates.
          </p>
        </section>
      );

    case 'error':
      return (
        <div data-testid="swap-error" className="flex flex-col gap-3">
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
          >
            <p className="font-semibold">{state.message}</p>
            {state.requestId && (
              <p className="mt-1 font-mono text-xs opacity-90">
                Request ID: <code>{state.requestId}</code>
              </p>
            )}
            {onRetry && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={onRetry}
                  aria-label="Retry quote request"
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 dark:bg-rose-700 dark:hover:bg-rose-600"
                >
                  Retry quote
                </button>
              </div>
            )}
          </div>
          <SlippageView
            status="error"
            errorMessage={state.message}
            onRetry={onRetry}
          />
        </div>
      );

    case 'success': {
      const { quote } = state;
      const amountFmt = formatQuoteAmountDisplay(quote.amount);
      const rateFmt = formatQuoteRateDisplay(quote.estimated_rate);

      return (
        <div data-testid="swap-success" className="flex flex-col gap-4">
          <section
            role="status"
            aria-live="polite"
            className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm dark:border-emerald-900 dark:bg-emerald-950/80"
          >
            <dl className="grid gap-3">
              <div>
                <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                  Route
                </dt>
                <dd className="mt-0.5 text-base font-semibold text-emerald-950 dark:text-emerald-200">
                  {quote.route.join(' → ')}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                    Amount
                  </dt>
                  <dd title={amountFmt.title} className="mt-0.5 font-medium">
                    {amountFmt.display}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-neutral-700 dark:text-neutral-300">
                    Estimated rate
                  </dt>
                  <dd title={rateFmt.title} className="mt-0.5 font-medium">
                    {rateFmt.display}
                  </dd>
                </div>
              </div>
            </dl>
          </section>
          <SlippageView
            status="success"
            slippage={`${((Number(quote.estimated_rate) - 1) * 100).toFixed(2)}%`}
          />
        </div>
      );
    }
  }
}

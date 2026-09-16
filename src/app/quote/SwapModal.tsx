'use client';

import { useRef } from 'react';
import { type Quote } from '@/lib/types';
import { formatQuoteAmountDisplay, formatQuoteRateDisplay } from '@/lib/format';
import { useFocusTrap } from '@/lib/useFocusTrap';

type Props = {
  quote: Quote | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function SwapModal({ quote, open, onClose, onConfirm }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, { isActive: open, onClose });

  if (!open || !quote) return null;

  const amountFmt = formatQuoteAmountDisplay(quote.amount);
  const rateFmt = formatQuoteRateDisplay(quote.estimated_rate);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="swap-modal-title" className="text-lg font-semibold">
          Review swap details
        </h2>
        <div className="mt-4 grid gap-2 text-sm">
          <div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300">
              Route
            </div>
            <div>{quote.route.join(' → ')}</div>
          </div>
          <div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300">
              Amount
            </div>
            <div title={amountFmt.title}>{amountFmt.display}</div>
          </div>
          <div>
            <div className="font-medium text-neutral-700 dark:text-neutral-300">
              Estimated rate
            </div>
            <div title={rateFmt.title}>{rateFmt.display}</div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:border-neutral-700 dark:hover:bg-neutral-800" // stableroute-disable-line secret-scan
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:bg-white dark:text-black dark:hover:bg-neutral-200" // stableroute-disable-line secret-scan
            onClick={onConfirm}
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
}

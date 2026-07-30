'use client';

import { memo } from 'react';
import { Tooltip } from '@/components/Tooltip';

/**
 * UI for displaying slippage information.
 *
 * - empty → No quote yet (initial load).
 * - loading → Quote request in progress.
 * - error → Quote request failed; user can retry.
 * - success → Quote succeeded; slippage value is shown.
 *
 * All state changes are announced via `role="status"` and `aria-live="polite"`
 * for assistive technology.
 */
export type SlippageStatus = 'loading' | 'empty' | 'error' | 'success';

type Props = {
  /** Current status of the slippage view. */
  status: SlippageStatus;
  /** Slippage string to display when `status === 'success'`. */
  slippage?: string;
  /** Optional error message shown when `status === 'error'`. */
  errorMessage?: string;
  /** Callback invoked when the user clicks “Try again”. */
  onRetry?: () => void;
};

function SlippageBase({ status, slippage, errorMessage, onRetry }: Props) {
  // Accessible live region – always present, content changes with status.
  const liveRegion = (
    <span role="status" aria-live="polite" data-testid="slippage-status">
      {status === 'empty' && 'No slippage data'}
      {status === 'loading' && 'Calculating slippage…'}
      {status === 'error' && `Error: ${errorMessage ?? 'Unable to calculate'}`}
      {status === 'success' && `Slippage: ${slippage}`}
    </span>
  );

  // Wrap in a Tooltip on error to surface the error message.
  const tooltip =
    status === 'error' ? (
      <Tooltip content={errorMessage ?? 'Error'}>
        {liveRegion}
      </Tooltip>
    ) : (
      liveRegion
    );

  return (
    <section className="flex items-center gap-2">
      {tooltip}
      {status === 'error' && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded bg-amber-600 px-3 py-1 text-sm text-white hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
        >
          Try again
        </button>
      )}
    </section>
  );
}

export const SlippageView = memo(SlippageBase);

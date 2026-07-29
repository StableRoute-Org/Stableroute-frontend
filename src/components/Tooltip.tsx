import { memo, type ReactNode } from 'react';

export type TooltipStatus = 'loading' | 'empty' | 'error' | 'success';

type Props = {
  /** Mutually-exclusive render state. Drives which status message shows. */
  status: TooltipStatus;
  /** Message shown for the current state (e.g. error detail, empty hint). */
  message?: string;
  /** The element the tooltip is attached to (trigger / content). */
  children: ReactNode;
};

const STATUS_LABEL: Record<TooltipStatus, string> = {
  loading: 'Loading',
  empty: 'No data',
  error: 'Error',
  success: 'Ready',
};

function TooltipBase({ status, message, children }: Props) {
  return (
    <span className="relative inline-flex">
      {children}
      <span
        role="status"
        aria-live="polite"
        data-testid="tooltip-status"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
      >
        {STATUS_LABEL[status]}
        {message ? `: ${message}` : ''}
      </span>
    </span>
  );
}

/**
 * Tooltip surface that reflects one of four mutually-exclusive states:
 * loading, empty, error, success. The trigger/content always renders; the
 * status text (exposed via role="status" for assistive tech) changes.
 *
 * Memoized so stable props prevent needless re-renders of the trigger subtree.
 */
export const Tooltip = memo(TooltipBase);

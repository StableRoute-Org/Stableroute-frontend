import { memo, type ReactNode } from 'react';

export type HelpStatus = 'loading' | 'empty' | 'error' | 'success';

type Props = {
  /** Mutually-exclusive render state. Drives which status message shows. */
  status: HelpStatus;
  /** Message shown for the current state (e.g. error detail, empty hint). */
  message?: string;
  /** The element the help affordance is attached to (trigger / content). */
  children: ReactNode;
};

const STATUS_LABEL: Record<HelpStatus, string> = {
  loading: 'Loading help…',
  empty: 'No help available',
  error: 'Help unavailable',
  success: 'Help ready',
};

function HelpBase({ status, message, children }: Props) {
  return (
    <span className="relative inline-flex items-start gap-2">
      {children}
      <span
        role="status"
        aria-live="polite"
        data-testid="help-status"
        className="text-sm text-neutral-600 dark:text-neutral-400"
      >
        {STATUS_LABEL[status]}
        {message ? `: ${message}` : ''}
      </span>
    </span>
  );
}

/**
 * Contextual help surface that reflects one of four mutually-exclusive
 * states: loading, empty, error, success. The trigger/content always
 * renders; the status text (exposed via role="status" for assistive tech)
 * changes to reflect the current fetch/availability state of the help copy.
 *
 * Memoized so stable props prevent needless re-renders of the trigger subtree.
 */
export const Help = memo(HelpBase);
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';

export type HelpStatus = 'loading' | 'empty' | 'error' | 'success';

type Props = {
  /** Mutually-exclusive render state. Drives which status message shows. */
  status: HelpStatus;
  /** Message shown for the current state (e.g. error detail, empty hint). */
  message?: string;
  /** The element the help affordance is attached to (trigger / content). */
  children: ReactNode;
  /**
   * Debounce window (ms) for the live-region announcement.
   * Rapid status changes are coalesced so the last one wins.
   * Defaults to 300ms. Set to 0 for immediate announcement.
   */
  debounceMs?: number;
};

const STATUS_LABEL: Record<HelpStatus, string> = {
  loading: 'Loading help…',
  empty: 'No help available',
  error: 'Help unavailable',
  success: 'Help ready',
};

function HelpBase({ status, message, children, debounceMs = 300 }: Props) {
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  // Seed the previous-status ref with the initial status so the very first
  // effect run sees "no change" and never announces the initial mount.
  const prevStatusRef = useRef<HelpStatus>(status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Only announce when status actually changes.
    if (prevStatus === status) return;

    const buildAnnouncement = () => {
      const base = STATUS_LABEL[status];
      return message ? `${base}: ${message}` : base;
    };

    if (debounceMs <= 0) {
      setLiveAnnouncement(buildAnnouncement());
      return;
    }

    timerRef.current = setTimeout(() => {
      setLiveAnnouncement(buildAnnouncement());
      timerRef.current = null;
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, message, debounceMs]);

  return (
    <span className="relative inline-flex items-start gap-2">
      {children}
      {/* Visible status text (no visual change) */}
      <span
        role="status"
        aria-live="polite"
        data-testid="help-status"
        className="text-sm text-neutral-600 dark:text-neutral-400"
      >
        {STATUS_LABEL[status]}
        {message ? `: ${message}` : ''}
      </span>
      {/* Screen-reader-only live region for status change announcements */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="help-live-region"
      >
        {liveAnnouncement}
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
 * A separate `sr-only` live region (`aria-live="polite"`, `aria-atomic="true"`)
 * announces status changes as they occur, with a configurable debounce window
 * (default 300ms) to coalesce rapid updates. The initial mount is skipped so
 * the empty region is never announced on first render.
 *
 * Memoized so stable props prevent needless re-renders of the trigger subtree.
 */
export const Help = memo(HelpBase);

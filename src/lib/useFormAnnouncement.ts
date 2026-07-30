'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages a polite live-region announcement for form status changes.
 *
 * - Skips the initial mount so the empty region is never announced.
 * - When `debounceMs` > 0, rapid successive calls are debounced so the
 *   queue is not spammed.  Defaults to 0 (immediate, suitable for form
 *   lifecycle transitions where each state is a distinct event).
 * - Provides an `announce(msg)` function that updates the message.
 * - The caller renders `<p aria-live="polite" className="sr-only">{message}</p>`.
 */
export function useFormAnnouncement(debounceMs = 0) {
  const [message, setMessage] = useState('');
  const isMounted = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  const announce = useCallback(
    (msg: string) => {
      if (!isMounted.current) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (debounceMs <= 0) {
        setMessage(msg);
        return;
      }

      timerRef.current = setTimeout(() => {
        setMessage(msg);
        timerRef.current = null;
      }, debounceMs);
    },
    [debounceMs]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { message, announce } as const;
}

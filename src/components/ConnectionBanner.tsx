'use client';

import { useCallback, useEffect, useState } from 'react';
import { registerConnectionHandler } from '@/lib/apiClient';

const CONSECUTIVE_FAILURE_THRESHOLD = 2;

export function ConnectionBanner() {
  const [visible, setVisible] = useState(false);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);

  const handleError = useCallback(() => {
    setConsecutiveFailures((prev) => {
      const next = prev + 1;
      if (next >= CONSECUTIVE_FAILURE_THRESHOLD) {
        setVisible(true);
      }
      return next;
    });
  }, []);

  const handleSuccess = useCallback(() => {
    setConsecutiveFailures(0);
    setVisible(false);
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setVisible(true);
    };

    window.addEventListener('offline', handleOffline);

    const unregister = registerConnectionHandler({
      onError: handleError,
      onSuccess: handleSuccess,
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener('offline', handleOffline);
      unregister();
    };
  }, [handleError, handleSuccess]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 text-sm">
        <span>
          The API is unreachable. Check your connection or try again later.
        </span>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss connectivity warning"
          className="shrink-0 rounded px-2 py-1 text-xs font-medium hover:bg-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-amber-800"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import './globals.css';

export function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      'Global error boundary caught:',
      error.digest ?? error.message
    );
  }, [error]);

  return (
    <div
      id="main-content"
      tabIndex={-1}
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center focus:outline-none"
    >
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <div
        role="alert"
        className="text-sm text-neutral-600 dark:text-neutral-400"
      >
        <p>{error.message || 'Unexpected error.'}</p>
        {error.requestId && (
          <p className="mt-1 text-xs">
            Request ID: <code>{error.requestId}</code>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]"
      >
        Try again
      </button>
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <GlobalErrorContent error={error} reset={reset} />
      </body>
    </html>
  );
}

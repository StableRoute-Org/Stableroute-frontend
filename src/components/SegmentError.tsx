"use client";

import { useEffect } from "react";

export type SegmentErrorProps = {
  /** Human-readable segment name (e.g. "quote"); used in the heading and log line. */
  segment: string;
  /** Error forwarded by the Next.js segment boundary. */
  error: Error & { digest?: string; requestId?: string };
  /** Next.js reset callback: re-renders only this segment, no full page reload. */
  reset: () => void;
};

/**
 * Shared fallback UI for segment-level `error.tsx` boundaries.
 *
 * Rendered in place of a crashed segment while the root layout — skip link,
 * header, navigation, footer — stays mounted. The "Try again" button calls
 * the boundary's `reset()` so recovery re-renders just the segment instead
 * of reloading the page.
 */
export function SegmentError({ segment, error, reset }: SegmentErrorProps) {
  useEffect(() => {
    console.error(`${segment} segment error boundary caught:`, error.digest ?? error.message);
  }, [segment, error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center focus:outline-none"
    >
      <h1 className="text-2xl font-semibold">The {segment} page hit an error.</h1>
      <div role="alert" className="text-sm text-neutral-600 dark:text-neutral-400">
        <p>{error.message || "Unexpected error."}</p>
        {error.requestId && (
          <p className="mt-1 text-xs">
            Request ID: <code>{error.requestId}</code>
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        Try again
      </button>
    </main>
  );
}

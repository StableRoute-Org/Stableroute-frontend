"use client";

import { useEffect } from "react";

type BoundaryError = Error & { digest?: string };

function getErrorSummary(error: BoundaryError) {
  return {
    message: error.message || "Unexpected error.",
    digest: error.digest,
  };
}

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: BoundaryError;
  reset: () => void;
}) {
  useEffect(() => {
    /**
     * Keep detailed diagnostics out of production logs because API errors can
     * carry assigned backend fields such as requestId or route-specific data.
     */
    if (process.env.NODE_ENV !== "production") {
      console.error("App error boundary caught:", getErrorSummary(error));
    }
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center focus:outline-none"
    >
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        We could not complete that action. Please try again.
      </p>
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

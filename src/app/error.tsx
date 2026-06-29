"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center focus:outline-none"
    >
      <h1 className="text-2xl font-semibold">Something went wrong.</h1>
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

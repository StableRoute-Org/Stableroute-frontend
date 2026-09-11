/**
 * Skeleton placeholders for the swap interface.
 *
 * Each skeleton matches the dimensions and layout of its real
 * counterpart so there is no layout shift when content arrives.
 * The outer wrapper announces "Loading swap interface" to
 * assistive technology via `aria-busy` and a visually-hidden
 * live region.
 *
 * ## Sections
 *
 * - **Header**: page title + subtitle (h1 + p)
 * - **QuoteHistory**: "Recent quotes" heading + 2 placeholder rows
 * - **Form**: 3 text fields + swap button + submit button
 * - **Slippage**: status tile placeholder
 */
export function SwapSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading swap interface"
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-10 p-8"
    >
      <span className="sr-only">Loading swap interface…</span>

      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <div className="h-9 w-48 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Quote history skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-5 w-32 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Form skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-20 animate-pulse self-center rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-28 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      {/* Slippage skeleton */}
      <div className="h-16 w-full animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}

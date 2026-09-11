import { Suspense } from 'react';
import QuoteClient from './Client';
import { SwapErrorBoundary } from '@/components/SwapErrorBoundary';
import { SwapSkeleton } from '@/components/SwapSkeleton';

/**
 * Server wrapper for the interactive `QuoteClient`.
 * Exports per-page `metadata` so search engines and assistive tech get route context.
 *
 * ## Error isolation & loading
 *
 * The client component is wrapped in:
 * - `SwapErrorBoundary` — catches unhandled throws in the swap subtree
 *   and renders a scoped retry UI instead of crashing the whole page.
 * - `Suspense` with `SwapSkeleton` — shows skeleton placeholders that
 *   match the real layout (no layout shift) while the client bundle
 *   loads. The skeleton announces "Loading" to assistive tech.
 */
export const metadata = {
  title: 'Quote',
  description:
    'Request a routing quote for a source/destination/amount triple.',
};

export default function QuotePage() {
  return (
    <SwapErrorBoundary section="swap interface">
      <Suspense fallback={<SwapSkeleton />}>
        <QuoteClient />
      </Suspense>
    </SwapErrorBoundary>
  );
}

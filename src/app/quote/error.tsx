'use client';

import {
  SegmentError,
  type SegmentErrorProps,
} from '@/components/SegmentError';

/**
 * Segment-level error boundary for `/quote`.
 *
 * Catches render/effect errors thrown inside `QuoteClient` so a quote
 * failure no longer bubbles up to the root `src/app/error.tsx` and unmounts
 * the whole dashboard. The header and navigation in the root layout stay
 * mounted; "Try again" calls Next's `reset()` to re-render just this
 * segment without a full page reload.
 */
export default function QuoteError(props: Omit<SegmentErrorProps, 'segment'>) {
  return <SegmentError segment="quote" {...props} />;
}

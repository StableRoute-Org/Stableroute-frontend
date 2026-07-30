'use client';

import { memo } from 'react';
import {
  SegmentError,
  type SegmentErrorProps,
} from '@/components/SegmentError';

/**
 * Segment-level error boundary for `/events`.
 *
 * Catches render/effect errors thrown inside `EventsClient` (including
 * failures during the polling refresh cycle) so an events failure no longer
 * bubbles up to the root `src/app/error.tsx` and unmounts the whole
 * dashboard. The header and navigation in the root layout stay mounted;
 * "Try again" calls Next's `reset()` to re-render just this segment without
 * a full page reload.
 */
const EventsError = memo(function EventsError(
  props: Omit<SegmentErrorProps, 'segment'>
) {
  return <SegmentError segment="events" {...props} />;
});

export default EventsError;

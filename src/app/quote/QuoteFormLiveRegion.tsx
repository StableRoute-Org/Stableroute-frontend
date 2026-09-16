'use client';

import React from 'react';
import {
  formatValidationSummaryAnnouncement,
  type QuoteFieldError,
} from './quoteSchema';

export interface QuoteFormLiveRegionProps {
  errors: readonly QuoteFieldError[];
  /** When true (e.g. immediately after a failed submit), live region announces assertively. Defaults to false (polite). */
  isAssertive?: boolean;
}

/**
 * Accessible live region summarizing form validation errors (#727).
 *
 * Requirements:
 * - Announce the summary politely, not assertively, unless on submit.
 * - Screen readers receive structured error counts and failing fields.
 * - Renders null when there are no errors to prevent cluttering the accessibility tree
 *   or conflicting with page-level status regions.
 */
export function QuoteFormLiveRegion({
  errors,
  isAssertive = false,
}: QuoteFormLiveRegionProps) {
  if (errors.length === 0) {
    return null;
  }

  const message = formatValidationSummaryAnnouncement(errors);

  return (
    <div
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className="sr-only"
      data-testid="quote-form-live-region"
    >
      {message}
    </div>
  );
}

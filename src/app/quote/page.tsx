import QuoteClient from './Client';

/**
 * Server wrapper for the interactive `QuoteClient`.
 * Exports per-page `metadata` so search engines and assistive tech get route context.
 */
export const metadata = {
  title: 'Quote',
  description:
    'Request a routing quote for a source/destination/amount triple.',
};

export default function QuotePage() {
  return <QuoteClient />;
}

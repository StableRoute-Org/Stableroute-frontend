import PairsClient from './Client';

/**
 * Server wrapper for the client `PairsClient`.
 *
 * Next.js App Router only allows `export const metadata` from server components.
 * We keep interactive UI in a client component and export per-page metadata here.
 */
export const metadata = {
  title: 'Pairs',
  description:
    'Manage registered routing (source → destination) pairs for the StableRoute router.',
};

export default function PairsPage() {
  return <PairsClient />;
}

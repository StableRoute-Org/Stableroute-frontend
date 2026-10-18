import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About StableRoute: a liquidity router for stablecoin and fiat-backed token pairs on Stellar.',
};

/**
 * Server component for the About page.
 */
export default function AboutPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-5 px-4 py-16 focus:outline-none"
    >
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
        About
      </p>
      <h1 className="text-4xl font-bold tracking-tight">About StableRoute</h1>
      <p className="text-lg text-neutral-700 dark:text-neutral-300">
        StableRoute is a liquidity router for stablecoin and fiat-backed token
        pairs on Stellar. The on-chain router contract tracks registered pairs,
        per-pair fees, min/max amounts, and reported liquidity; the backend
        mirrors this state for fast quoting and the dashboard surface.
      </p>
      <p className="text-neutral-700 dark:text-neutral-300">
        Use this dashboard to register routing pairs, configure per-pair fees
        and bounds, get quote previews, and operate the pause / unpause flag
        during incidents.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/docs" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
          Read the docs
        </Link>
        <Link href="/quote" className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
          Try a quote
        </Link>
      </div>
    </main>
  );
}

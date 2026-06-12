export const metadata = { title: "About — StableRoute" };

export default function AboutPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-4 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">About StableRoute</h1>
      <p className="text-neutral-700 dark:text-neutral-300">
        StableRoute is a liquidity router for stablecoin and fiat-backed
        token pairs on Stellar. The on-chain router contract tracks
        registered pairs, per-pair fees, min/max amounts, and reported
        liquidity; the backend mirrors this state for fast quoting and the
        dashboard surface.
      </p>
      <p className="text-neutral-700 dark:text-neutral-300">
        Use this dashboard to register routing pairs, configure per-pair
        fees and bounds, get quote previews, and operate the pause /
        unpause flag during incidents.
      </p>
    </main>
  );
}

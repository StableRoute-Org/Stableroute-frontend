import type { Metadata } from 'next';
import Link from 'next/link';
import { LiveNetwork } from '@/components/LiveNetwork';

export const metadata: Metadata = {
  description:
    'StableRoute finds the best route for stablecoin payments on Stellar: quotes, pair management and an on-chain Soroban router.',
};

const features = [
  {
    title: 'Best-path quotes',
    desc: 'Price a transfer between any two registered stablecoins and see the fee, slippage and minimum received before you sign.',
    icon: 'M3 12h4l3-8 4 16 3-8h4',
  },
  {
    title: 'On-chain router',
    desc: 'A Soroban contract records pairs, per-pair fees, bounds and liquidity, with admin handover, timelocks and an emergency pause.',
    icon: 'M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-4-8-8V7l8-4z',
  },
  {
    title: 'Operator console',
    desc: 'Register pairs, tune fees, rotate API keys, subscribe webhooks and audit every event from one dashboard.',
    icon: 'M4 6h16M4 12h16M4 18h10',
  },
  {
    title: 'Developer-first API',
    desc: 'A typed REST API with OpenAPI docs, idempotency keys, ETag caching and structured errors.',
    icon: 'M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12',
  },
];

const steps = [
  {
    n: '1',
    title: 'Register a pair',
    desc: 'Operators register a source → destination asset pair (for example USDC → EURC) and set its fee in basis points.',
  },
  {
    n: '2',
    title: 'Request a quote',
    desc: 'Wallets and apps call the routing API with an amount. StableRoute returns the route, fee and minimum received.',
  },
  {
    n: '3',
    title: 'Settle on Stellar',
    desc: 'The router contract enforces bounds, cooldowns and pause state on-chain, so every route follows the same rules.',
  },
];

const stats = [
  { label: 'Settlement', value: '~5s' },
  { label: 'Max fee', value: '10%' },
  { label: 'Batch size', value: '100' },
  { label: 'Network', value: 'Testnet' },
];

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 mx-auto h-[36rem] max-w-5xl rounded-full bg-gradient-to-tr from-indigo-400/30 via-sky-300/20 to-emerald-300/20 blur-3xl dark:from-indigo-600/20 dark:via-sky-500/10 dark:to-emerald-500/10"
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-500/30 dark:bg-neutral-900/70 dark:text-indigo-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            Live on Stellar testnet
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Route stablecoins across Stellar,{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-sky-300">
              at the best price.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
            StableRoute is a liquidity router for stablecoin and fiat-backed token
            pairs. Get instant quotes, manage routing pairs and enforce routing
            rules on-chain with a Soroban smart contract.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/quote"
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500"
            >
              Get a quote
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Read the docs
            </Link>
          </div>
          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-neutral-200 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/70"
              >
                <dt className="text-xs uppercase tracking-wide text-neutral-500">{s.label}</dt>
                <dd className="mt-1 text-2xl font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="features-heading" className="text-center text-3xl font-bold tracking-tight">
          Everything you need to route stable value
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-neutral-600 dark:text-neutral-400">
          One router, three layers: a web console, a routing API and an on-chain contract.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mx-auto max-w-6xl px-4 py-16">
        <h2 id="how-heading" className="text-center text-3xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-400 text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Live deployment */}
      <section aria-labelledby="live-heading" className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-white to-indigo-50/60 p-6 sm:p-10 dark:border-neutral-800 dark:from-neutral-900 dark:to-indigo-950/30">
          <h2 id="live-heading" className="text-2xl font-bold tracking-tight">
            Live deployment
          </h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            The console talks to the hosted routing API, which mirrors the router contract deployed on Stellar testnet.
          </p>
          <div className="mt-6">
            <LiveNetwork />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-sky-500 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight">Start routing in minutes</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-50">
            Register a pair, request a quote and watch the router work — no wallet required on testnet.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/pairs" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
              Manage pairs
            </Link>
            <Link href="/docs" className="rounded-xl border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Developer docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

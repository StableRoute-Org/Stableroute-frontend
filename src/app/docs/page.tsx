import type { Metadata } from 'next';
import Link from 'next/link';
import { CodeSample, type Language } from '@/components/CodeSample';
import {
  CONTRACT_EXPLORER_URL,
  CONTRACT_ID,
  REPOS,
  STELLAR_NETWORK,
  getApiLinks,
} from '@/lib/site';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Docs',
  description:
    'StableRoute documentation: product overview, architecture, how to use the console, the routing API and the Soroban router contract.',
};

const toc = [
  { id: 'overview', label: 'Overview' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'how-to-use', label: 'How to use' },
  { id: 'api', label: 'Routing API' },
  { id: 'contract', label: 'Smart contract' },
  { id: 'links', label: 'Resources' },
];

type EndpointSection = {
  h: string;
  p: string;
  samples: Record<Language, string>;
};

function endpoints(base: string): EndpointSection[] {
  return [
    {
      h: 'GET /health',
      p: 'Liveness probe. Returns {"status":"ok"} when the API is up.',
      samples: {
        curl: `curl ${base}/health`,
        javascript: `const res = await fetch("${base}/health");
const { status } = await res.json();`,
      },
    },
    {
      h: 'POST /api/v1/pairs',
      p: 'Register a (source, destination) routing pair. Idempotent.',
      samples: {
        curl: `curl -X POST ${base}/api/v1/pairs \\
  -H "Content-Type: application/json" \\
  -d '{"source": "USDC", "destination": "EURC"}'`,
        javascript: `const res = await fetch("${base}/api/v1/pairs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source: "USDC", destination: "EURC" }),
});
const data = await res.json();`,
      },
    },
    {
      h: 'GET /api/v1/pairs',
      p: 'List every registered pair, with cursor pagination and ETag caching.',
      samples: {
        curl: `curl ${base}/api/v1/pairs`,
        javascript: `const res = await fetch("${base}/api/v1/pairs");
const { pairs } = await res.json();`,
      },
    },
    {
      h: 'GET /api/v1/quote',
      p: 'Quote a route for an amount: returns rate, fee, slippage and minimum received.',
      samples: {
        curl: `curl "${base}/api/v1/quote?source_asset=USDC&dest_asset=EURC&amount=100"`,
        javascript: `const params = new URLSearchParams({
  source_asset: "USDC",
  dest_asset: "EURC",
  amount: "100",
});
const res = await fetch(\`${base}/api/v1/quote?\${params}\`);
const quote = await res.json();`,
      },
    },
    {
      h: 'PATCH /api/v1/pairs/:src/:dest/fee_bps',
      p: 'Set the per-pair routing fee in basis points (0..1000).',
      samples: {
        curl: `curl -X PATCH ${base}/api/v1/pairs/USDC/EURC/fee_bps \\
  -H "Content-Type: application/json" \\
  -d '{"fee_bps": 30}'`,
        javascript: `await fetch("${base}/api/v1/pairs/USDC/EURC/fee_bps", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fee_bps: 30 }),
});`,
      },
    },
  ];
}

const card =
  'rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900';
const h2 = 'scroll-mt-24 text-2xl font-bold tracking-tight';
const prose = 'mt-3 text-neutral-700 dark:text-neutral-300';
const code =
  'rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-neutral-800';
const extLink =
  'font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400';

export default function DocsPage() {
  const api = getApiLinks();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto max-w-6xl px-4 py-12 focus:outline-none"
    >
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          Documentation
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">StableRoute docs</h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">
          Everything you need to understand, operate and integrate the StableRoute
          liquidity router.
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 space-y-1 text-sm">
            {toc.map((t) => (
              <li key={t.id}>
                <a
                  href={`#${t.id}`}
                  className="block rounded-md px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                >
                  {t.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-14">
          <section id="overview" aria-labelledby="overview-h">
            <h2 id="overview-h" className={h2}>Overview</h2>
            <p className={prose}>
              StableRoute is a liquidity router for stablecoin and fiat-backed token
              pairs on Stellar. Operators register routing pairs (for example{' '}
              <code className={code}>USDC → EURC</code>), configure fees and
              bounds, and expose a quoting API that wallets, payment apps and
              treasuries can call to find the best path for a transfer.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                ['Quote', 'Instant price, fee and minimum-received for any registered pair.'],
                ['Govern', 'Per-pair fees, min/max amounts, cooldowns and liquidity limits.'],
                ['Protect', 'Emergency pause, timelocked admin handover and an audit log.'],
              ].map(([t, d]) => (
                <div key={t} className={card}>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{d}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="architecture" aria-labelledby="architecture-h">
            <h2 id="architecture-h" className={h2}>Architecture</h2>
            <p className={prose}>StableRoute has three components, each in its own repository:</p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className={card}>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Frontend</p>
                <p className="mt-2 font-semibold">Web console</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Next.js app (this site) for quoting, pair management, stats and operator tools.
                </p>
              </div>
              <div className={card}>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Backend</p>
                <p className="mt-2 font-semibold">Routing API</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Express + TypeScript service: pair registry, pricing engine, webhooks, API keys, metrics.
                </p>
              </div>
              <div className={card}>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Contracts</p>
                <p className="mt-2 font-semibold">Soroban router</p>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  Rust smart contract on Stellar that stores pairs, fees, bounds and pause state on-chain.
                </p>
              </div>
            </div>
            <pre className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-neutral-950 p-5 font-mono text-xs leading-relaxed text-neutral-200 dark:border-neutral-800">
{`  Browser / wallet / app
          │  HTTPS (JSON)
          ▼
  ┌─────────────────────┐        ┌──────────────────────────┐
  │  StableRoute API    │  RPC   │  StableRouteRouter       │
  │  (Express, Vercel)  │ ─────▶ │  (Soroban, Stellar ${STELLAR_NETWORK.padEnd(7)})│
  │  quotes · pairs ·   │        │  pairs · fees · bounds · │
  │  webhooks · metrics │        │  pause · admin handover  │
  └─────────────────────┘        └──────────────────────────┘`}
            </pre>
          </section>

          <section id="how-to-use" aria-labelledby="how-h">
            <h2 id="how-h" className={h2}>How to use</h2>
            <ol className="mt-4 space-y-4">
              {[
                ['Check the API is live', <>Open the <Link className={extLink} href="/status">Status</Link> page — it pings the routing API and reports latency.</>],
                ['Register a pair', <>Go to <Link className={extLink} href="/pairs">Pairs</Link> and add a source/destination asset pair such as USDC → EURC.</>],
                ['Get a quote', <>Open <Link className={extLink} href="/quote">Quote</Link>, choose the pair and an amount, and review the route, fee and minimum received.</>],
                ['Monitor', <>Use <Link className={extLink} href="/stats">Stats</Link> and <Link className={extLink} href="/events">Events</Link> to watch volume and audit activity.</>],
                ['Operate', <>Pause or resume routing from <Link className={extLink} href="/admin">Admin</Link>; manage <Link className={extLink} href="/api-keys">API keys</Link> and <Link className={extLink} href="/webhooks">webhooks</Link>.</>],
              ].map(([t, d], i) => (
                <li key={i} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="font-semibold">{t}</p>
                    <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section id="api" aria-labelledby="api-h">
            <h2 id="api-h" className={h2}>Routing API</h2>
            <p className={prose}>
              Base URL: <code className={code}>{api.base}</code>. The full, interactive
              reference (Swagger UI) is at{' '}
              <a className={extLink} href={api.docs} target="_blank" rel="noopener noreferrer">
                {api.docs}
              </a>{' '}
              and the raw OpenAPI spec at{' '}
              <a className={extLink} href={api.openapi} target="_blank" rel="noopener noreferrer">
                /openapi.yaml
              </a>
              .
            </p>
            <dl className="mt-6 space-y-8">
              {endpoints(api.base).map((s) => (
                <div key={s.h}>
                  <dt className="font-mono text-sm font-semibold">{s.h}</dt>
                  <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{s.p}</dd>
                  <dd className="mt-3">
                    <CodeSample samples={s.samples} endpoint={s.h} />
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section id="contract" aria-labelledby="contract-h">
            <h2 id="contract-h" className={h2}>Smart contract</h2>
            <p className={prose}>
              The <code className={code}>StableRouteRouter</code> Soroban contract is
              deployed on Stellar <span className="capitalize">{STELLAR_NETWORK}</span>.
            </p>
            <div className={`${card} mt-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Contract ID</p>
              <p className="mt-1 break-all font-mono text-sm">{CONTRACT_ID}</p>
              <a className={`${extLink} mt-3 inline-block text-sm`} href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">
                View on stellar.expert ↗
              </a>
            </div>
            <p className={prose}>Read-only calls you can try with the Stellar CLI:</p>
            <pre className="mt-3 overflow-x-auto rounded-2xl bg-neutral-950 p-5 font-mono text-xs text-neutral-200">
{`stellar contract invoke --id ${CONTRACT_ID} \\
  --source <your-key> --network ${STELLAR_NETWORK} -- version

stellar contract invoke --id ${CONTRACT_ID} \\
  --source <your-key> --network ${STELLAR_NETWORK} -- \\
  get_pair_info --source USDC --destination EURC`}
            </pre>
          </section>

          <section id="links" aria-labelledby="links-h">
            <h2 id="links-h" className={h2}>Resources</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['API reference (Swagger)', api.docs],
                ['Contract on stellar.expert', CONTRACT_EXPLORER_URL],
                ['Frontend repository', REPOS.frontend],
                ['Backend repository', REPOS.backend],
                ['Contracts repository', REPOS.contracts],
                ['API health', api.health],
              ].map(([label, href]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm font-medium hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-500/5"
                  >
                    {label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

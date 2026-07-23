import type { Metadata } from 'next';
import { OpenApiLink } from './OpenApiLink';
import { CodeSample, type Language } from '@/components/CodeSample';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Short reference for the StableRoute HTTP API common endpoints.',
};

type EndpointSection = {
  h: string;
  p: string;
  samples: Record<Language, string>;
};

const sections: EndpointSection[] = [
  {
    h: 'POST /api/v1/pairs',
    p: 'Register a (source, destination) routing pair. Idempotent.',
    samples: {
      curl: `curl -X POST http://localhost:3001/api/v1/pairs \\
  -H "Content-Type: application/json" \\
  -d '{"source": "USDC", "destination": "EURC"}'`,
      javascript: `const res = await fetch("http://localhost:3001/api/v1/pairs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source: "USDC", destination: "EURC" }),
});
const data = await res.json();`,
    },
  },
  {
    h: 'GET /api/v1/pairs',
    p: 'List every registered pair. ETag caching.',
    samples: {
      curl: `curl http://localhost:3001/api/v1/pairs`,
      javascript: `const res = await fetch("http://localhost:3001/api/v1/pairs");
const { pairs } = await res.json();`,
    },
  },
  {
    h: 'PATCH /api/v1/pairs/:src/:dest/fee_bps',
    p: 'Set the per-pair routing fee in basis points (0..1000).',
    samples: {
      curl: `curl -X PATCH http://localhost:3001/api/v1/pairs/USDC/EURC/fee_bps \\
  -H "Content-Type: application/json" \\
  -d '{"fee_bps": 50}'`,
      javascript: `const res = await fetch(
  "http://localhost:3001/api/v1/pairs/USDC/EURC/fee_bps",
  {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fee_bps: 50 }),
  }
);
const data = await res.json();`,
    },
  },
  {
    h: 'GET /api/v1/quote',
    p: 'Request a quote for ?source_asset=&dest_asset=&amount=.',
    samples: {
      curl: `curl "http://localhost:3001/api/v1/quote?source_asset=USDC&dest_asset=EURC&amount=100"`,
      javascript: `const params = new URLSearchParams({
  source_asset: "USDC",
  dest_asset: "EURC",
  amount: "100",
});
const res = await fetch(\`http://localhost:3001/api/v1/quote?\${params}\`);
const quote = await res.json();`,
    },
  },
  {
    h: 'POST /api/v1/admin/{pause,unpause}',
    p: 'Operator-only pause / resume flag.',
    samples: {
      curl: `curl -X POST http://localhost:3001/api/v1/admin/pause`,
      javascript: `const res = await fetch("http://localhost:3001/api/v1/admin/pause", {
  method: "POST",
});
const data = await res.json();`,
    },
  },
];

export default function DocsPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">
        API documentation
      </h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        Companion to <OpenApiLink /> (opens external API spec) — short prose for
        the most common endpoints.
      </p>
      <dl className="space-y-6">
        {sections.map((s) => (
          <div key={s.h}>
            <dt className="font-mono text-sm font-medium">{s.h}</dt>
            <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              {s.p}
            </dd>
            <dd className="mt-2">
              <CodeSample samples={s.samples} endpoint={s.h} />
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

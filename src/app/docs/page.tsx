import { getApiBase } from '@/lib/config';

export const metadata = {
  title: 'Docs',
  description: 'Short reference for the StableRoute HTTP API common endpoints.',
};

const sections = [
  {
    h: 'POST /api/v1/pairs',
    p: 'Register a (source, destination) routing pair. Idempotent.',
  },
  { h: 'GET /api/v1/pairs', p: 'List every registered pair. ETag caching.' },
  {
    h: 'PATCH /api/v1/pairs/:src/:dest/fee_bps',
    p: 'Set the per-pair routing fee in basis points (0..1000).',
  },
  {
    h: 'GET /api/v1/quote',
    p: 'Request a quote for ?source_asset=&dest_asset=&amount=.',
  },
  {
    h: 'POST /api/v1/admin/{pause,unpause}',
    p: 'Operator-only pause / resume flag.',
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
        Companion to{' '}
        <a
          className="underline"
          href={`${getApiBase()}/api/v1/openapi.json`}
          rel="noopener noreferrer"
          target="_blank"
        >
          GET /api/v1/openapi.json
        </a>{' '}
        (opens external API spec) — short prose for the most common endpoints.
      </p>
      <dl className="space-y-4">
        {sections.map((s) => (
          <div key={s.h}>
            <dt className="font-mono text-sm font-medium">{s.h}</dt>
            <dd className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              {s.p}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

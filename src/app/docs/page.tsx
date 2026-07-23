import type { Metadata } from 'next';
import { OpenApiLink } from './OpenApiLink';
import { DocsSection } from "./Section";

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Docs — StableRoute',
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
        Companion to <OpenApiLink /> (opens external API spec) — short prose for
        the most common endpoints.
      </p>
      <div className="space-y-4">
        {sections.map((s) => (
          <DocsSection key={s.h} heading={s.h}>
            <p>{s.p}</p>
          </DocsSection>
        ))}
      </div>
    </main>
  );
}

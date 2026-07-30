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

      <hr className="my-2 border-neutral-200 dark:border-neutral-800" />

      <section aria-labelledby="search-component-heading">
        <h2
          id="search-component-heading"
          className="text-2xl font-semibold tracking-tight"
        >
          Search component
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          The <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">CommandPalette</code>{' '}
          component provides a keyboard-accessible command palette for quickly
          navigating between application routes.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-mono text-sm font-medium">Props</h3>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              The component accepts no props — it is self-contained and derives
              its route data from{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">ROUTES</code>{' '}
              in <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">@/lib/routes</code>.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-sm font-medium">Keyboard shortcuts</h3>
            <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-neutral-700 dark:text-neutral-300">
              <li>
                <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900">Ctrl+K</kbd>{' '}
                / <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900">⌘K</kbd>{' '}
                — Open / close the palette
              </li>
              <li>
                <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900">Esc</kbd>{' '}
                — Close the palette
              </li>
              <li>
                <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900">↓ ↑</kbd>{' '}
                — Navigate between matching routes
              </li>
              <li>
                <kbd className="rounded border border-neutral-300 bg-neutral-50 px-1 py-0.5 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-900">Enter</kbd>{' '}
                — Navigate to the highlighted route
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-mono text-sm font-medium">Filtering behavior</h3>
            <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">
              Typing in the input filters routes case-insensitively by their{' '}
              <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">title</code>{' '}
              field. When no routes match the query, the palette displays a
              &ldquo;No routes found&rdquo; message. Changing the query resets
              the active index to prevent stale selections.
            </p>
          </div>

          <div>
            <h3 className="font-mono text-sm font-medium">ARIA contract</h3>
            <table className="mt-1 w-full text-left text-sm">
              <caption className="sr-only">
                ARIA roles and attributes for the CommandPalette
              </caption>
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-800">
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Element
                  </th>
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Role
                  </th>
                  <th scope="col" className="py-1 font-medium">
                    Key attributes
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-700 dark:text-neutral-300">
                <tr>
                  <td className="py-1 pr-4">Overlay</td>
                  <td className="py-1 pr-4">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">dialog</code>
                  </td>
                  <td className="py-1">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-modal=&quot;true&quot;</code>,{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-label=&quot;Command palette&quot;</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Input</td>
                  <td className="py-1 pr-4">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">combobox</code>
                  </td>
                  <td className="py-1">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-expanded</code>,{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-controls</code>,{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-activedescendant</code>,{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-label=&quot;Search routes&quot;</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Results list</td>
                  <td className="py-1 pr-4">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">listbox</code>
                  </td>
                  <td className="py-1">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">id=&quot;command-palette-listbox&quot;</code>
                  </td>
                </tr>
                <tr>
                  <td className="py-1 pr-4">Each result</td>
                  <td className="py-1 pr-4">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">option</code>
                  </td>
                  <td className="py-1">
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">aria-selected</code>,{' '}
                    <code className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-xs dark:bg-neutral-800">id=&quot;command-palette-option-$&#123;href&#125;&quot;</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="font-mono text-sm font-medium">Usage example</h3>
            <div className="mt-1 rounded-md bg-neutral-50 p-4 text-sm dark:bg-neutral-950">
              <pre className="overflow-x-auto font-mono text-xs text-neutral-700 dark:text-neutral-300">
{`import { CommandPalette } from '@/components/CommandPalette';

// Render in the root layout — CommandPalette takes zero props.
// It registers a global keydown listener and manages its own
// open/close state internally.
export default function RootLayout({ children }) {
  return (
    <>
      <CommandPalette />
      {children}
    </>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

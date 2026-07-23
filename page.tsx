import { Metadata } from 'next';
import { PageHeading } from '@/components/PageHeading';
import { endpointRegistry } from '@/lib/endpointRegistry';
import { OpenApiLink } from './OpenApiLink';

export const metadata: Metadata = {
  title: 'API Documentation',
  description: 'Reference for the StableRoute HTTP API endpoints.',
};

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <PageHeading title="API Documentation">
        <p>
          This page documents the StableRoute HTTP API endpoints. For a formal
          specification, you can view the <OpenApiLink />.
        </p>
      </PageHeading>

      <div className="space-y-12">
        {endpointRegistry.length === 0 && (
          <p>No endpoint definitions available.</p>
        )}
        {endpointRegistry.map((endpoint) => (
          <section key={`${endpoint.method}-${endpoint.path}`} aria-labelledby={`endpoint-${endpoint.method}-${endpoint.path}`}>
            <h2 id={`endpoint-${endpoint.method}-${endpoint.path}`} className="text-xl font-semibold">
              <span className="font-mono text-lg bg-gray-100 dark:bg-gray-800 rounded-md px-2 py-1 mr-2">{endpoint.method}</span>
              <span className="font-mono text-lg">{endpoint.path}</span>
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{endpoint.description}</p>
            {endpoint.params && endpoint.params.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Parameters</h3>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {endpoint.params.map((param) => (
                    <li key={param.name}><code className="font-mono bg-gray-100 dark:bg-gray-800 rounded-md px-1">{param.name}</code> ({param.type}){param.required && <span className="text-red-500 ml-1">*required</span>} - {param.description}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
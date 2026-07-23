'use client';

import { getApiBase } from '@/lib/config';

/**
 * Client component for rendering the external OpenAPI link with environment-driven API base URL.
 */
export function OpenApiLink() {
  const apiBase = getApiBase();
  return (
    <a
      className="underline"
      href={`${apiBase}/api/v1/openapi.json`}
      rel="noopener noreferrer"
      target="_blank"
    >
      GET /api/v1/openapi.json
    </a>
  );
}

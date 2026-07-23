export type ApiConnectionTroubleshootingEntry = {
  symptom: string;
  module: string;
  action: string;
};

/** Default local API base when no env override is set. */
export const DEFAULT_API_BASE = 'http://localhost:3001';

/**
 * Resolved StableRoute API base URL (env override or local default).
 * Rejects non-http(s) schemes and values that fail URL parsing.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? DEFAULT_API_BASE;
  validateApiBase(raw);
  return raw.replace(/\/$/, '');
}

/** Validates a configured API base URL for safe browser use. */
export function validateApiBase(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('NEXT_PUBLIC_STABLEROUTE_API_BASE must be a valid URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('API base must use http or https');
  }
}

/** Returns a compact guide for common API connection failures. */
export function getApiConnectionTroubleshootingGuide(): ApiConnectionTroubleshootingEntry[] {
  return [
    {
      symptom: 'Misconfigured base URL',
      module: 'src/lib/config.ts',
      action: 'Update NEXT_PUBLIC_STABLEROUTE_API_BASE to the backend origin.',
    },
    {
      symptom: 'CORS or browser-blocked request',
      module: 'src/lib/apiClient.ts',
      action:
        'Verify the backend allows your frontend origin and that the API base points to the correct host.',
    },
    {
      symptom: 'Timeout or slow backend',
      module: 'src/lib/apiClient.ts',
      action: 'Check the backend health, network path, and retry with a higher timeout if needed.',
    },
    {
      symptom: '401 or 403 authorization failure',
      module: 'src/lib/apiClient.ts',
      action: 'Confirm the API key is valid, active, and authorized for the requested route.',
    },
  ];
}

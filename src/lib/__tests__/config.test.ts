import {
  DEFAULT_API_BASE,
  getApiBase,
  getApiConnectionTroubleshootingGuide,
  validateApiBase,
} from '../config';

describe('config', () => {
  const original = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  afterEach(() => {
    if (original === undefined)
      delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    else process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = original;
  });

  it('returns the env override when set', () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = 'https://api.example.test';
    expect(getApiBase()).toBe('https://api.example.test');
  });

  it('falls back to localhost when unset', () => {
    delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    expect(getApiBase()).toBe(DEFAULT_API_BASE);
  });

  it('rejects non-http(s) API base values', () => {
    expect(() => validateApiBase('ftp://bad.example')).toThrow(/http/);
  });

  it('returns troubleshooting guidance for common API connection failures', () => {
    const guide = getApiConnectionTroubleshootingGuide();

    expect(guide).toHaveLength(4);
    expect(guide).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symptom: 'Misconfigured base URL',
          module: 'src/lib/config.ts',
          action: 'Update NEXT_PUBLIC_STABLEROUTE_API_BASE to the backend origin.',
        }),
        expect.objectContaining({
          symptom: 'CORS or browser-blocked request',
          module: 'src/lib/apiClient.ts',
          action:
            'Verify the backend allows your frontend origin and that the API base points to the correct host.',
        }),
        expect.objectContaining({
          symptom: 'Timeout or slow backend',
          module: 'src/lib/apiClient.ts',
          action: 'Check the backend health, network path, and retry with a higher timeout if needed.',
        }),
        expect.objectContaining({
          symptom: '401 or 403 authorization failure',
          module: 'src/lib/apiClient.ts',
          action: 'Confirm the API key is valid, active, and authorized for the requested route.',
        }),
      ])
    );
  });
});

import nextConfig from '../../next.config';

describe('next.config security headers', () => {
  it('exports a headers() function', () => {
    expect(typeof nextConfig.headers).toBe('function');
  });

  it('applies security headers to every route via /:path*', async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe('/:path*');
  });

  it('includes all required baseline hardening headers', async () => {
    const rules = await nextConfig.headers!();
    const headers = Object.fromEntries(
      rules[0].headers.map((h) => [h.key, h.value])
    );

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toMatch(/camera=\(\)/);
    expect(headers['Permissions-Policy']).toMatch(/microphone=\(\)/);
    expect(headers['Permissions-Policy']).toMatch(/geolocation=\(\)/);
  });

  it('includes a Content-Security-Policy header', async () => {
    const rules = await nextConfig.headers!();
    const headers = Object.fromEntries(
      rules[0].headers.map((h) => [h.key, h.value])
    );

    expect(headers['Content-Security-Policy']).toBeDefined();
    expect(headers['Content-Security-Policy']).toMatch(/default-src 'self'/);
    expect(headers['Content-Security-Policy']).toMatch(
      /frame-ancestors 'none'/
    );
    expect(headers['Content-Security-Policy']).toMatch(/base-uri 'self'/);
    expect(headers['Content-Security-Policy']).toMatch(/form-action 'self'/);
  });

  it('CSP restricts connect-src to self and explicit origins only', async () => {
    const rules = await nextConfig.headers!();
    const csp =
      rules[0].headers.find((h) => h.key === 'Content-Security-Policy')
        ?.value ?? '';
    expect(csp).toMatch(/connect-src 'self'/);
  });

  it('sets Cross-Origin-Opener-Policy to same-origin', async () => {
    const rules = await nextConfig.headers!();
    const headers = rules[0].headers;
    const coop = headers.filter((h) => h.key === 'Cross-Origin-Opener-Policy');
    // Must appear exactly once — duplicate headers would send conflicting values.
    expect(coop).toHaveLength(1);
    expect(coop[0].value).toBe('same-origin');
  });

  it('sets Cross-Origin-Resource-Policy to same-origin', async () => {
    const rules = await nextConfig.headers!();
    const headers = rules[0].headers;
    const corp = headers.filter(
      (h) => h.key === 'Cross-Origin-Resource-Policy'
    );
    // Must appear exactly once.
    expect(corp).toHaveLength(1);
    expect(corp[0].value).toBe('same-origin');
  });

  it('CSP contains frame-ancestors exactly once', async () => {
    const rules = await nextConfig.headers!();
    const csp =
      rules[0].headers.find((h) => h.key === 'Content-Security-Policy')
        ?.value ?? '';
    const matches = csp.match(/frame-ancestors/g);
    // Duplicate directives would let a lenient parser use the weaker one.
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
    expect(csp).toMatch(/frame-ancestors 'none'/);
  });

  it('COOP and CORP headers each appear exactly once in the header list', async () => {
    const rules = await nextConfig.headers!();
    const keys = rules[0].headers.map((h) => h.key);
    const coopCount = keys.filter(
      (k) => k === 'Cross-Origin-Opener-Policy'
    ).length;
    const corpCount = keys.filter(
      (k) => k === 'Cross-Origin-Resource-Policy'
    ).length;
    expect(coopCount).toBe(1);
    expect(corpCount).toBe(1);
  });

  it('returns consistent headers across multiple invocations', async () => {
    const first = await nextConfig.headers!();
    const second = await nextConfig.headers!();
    expect(first[0].headers.map((h) => h.key)).toEqual(
      second[0].headers.map((h) => h.key)
    );
    expect(first[0].headers.map((h) => h.value)).toEqual(
      second[0].headers.map((h) => h.value)
    );
  });

  it('every header entry has non-empty key and value', async () => {
    const rules = await nextConfig.headers!();
    for (const rule of rules) {
      for (const header of rule.headers) {
        expect(header.key.trim().length).toBeGreaterThan(0);
        expect(header.value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has reactStrictMode enabled', () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it('exports a valid Next.js configuration object', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });
});

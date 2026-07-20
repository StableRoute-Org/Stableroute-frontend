import nextConfig from "../../next.config";

describe("next.config security headers", () => {
  it("exports a headers() function", () => {
    expect(typeof nextConfig.headers).toBe("function");
  });

  it("applies security headers to every route via /:path*", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
  });

  it("includes all required baseline hardening headers", async () => {
    const rules = await nextConfig.headers!();
    const headers = Object.fromEntries(
      rules[0].headers.map((h) => [h.key, h.value])
    );

    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toMatch(/camera=\(\)/);
    expect(headers["Permissions-Policy"]).toMatch(/microphone=\(\)/);
    expect(headers["Permissions-Policy"]).toMatch(/geolocation=\(\)/);
  });

  it("includes a Content-Security-Policy header", async () => {
    const rules = await nextConfig.headers!();
    const headers = Object.fromEntries(
      rules[0].headers.map((h) => [h.key, h.value])
    );

    expect(headers["Content-Security-Policy"]).toBeDefined();
    expect(headers["Content-Security-Policy"]).toMatch(/default-src 'self'/);
    expect(headers["Content-Security-Policy"]).toMatch(/frame-ancestors 'none'/);
    expect(headers["Content-Security-Policy"]).toMatch(/base-uri 'self'/);
    expect(headers["Content-Security-Policy"]).toMatch(/form-action 'self'/);
  });

  it("CSP restricts connect-src to self and explicit origins only", async () => {
    const rules = await nextConfig.headers!();
    const csp = rules[0].headers.find((h) => h.key === "Content-Security-Policy")?.value ?? "";
    expect(csp).toMatch(/connect-src 'self'/);
  });

  it("returns consistent headers across multiple invocations", async () => {
    const first = await nextConfig.headers!();
    const second = await nextConfig.headers!();
    expect(first[0].headers.map((h) => h.key)).toEqual(
      second[0].headers.map((h) => h.key)
    );
    expect(first[0].headers.map((h) => h.value)).toEqual(
      second[0].headers.map((h) => h.value)
    );
  });

  it("every header entry has non-empty key and value", async () => {
    const rules = await nextConfig.headers!();
    for (const rule of rules) {
      for (const header of rule.headers) {
        expect(header.key.trim().length).toBeGreaterThan(0);
        expect(header.value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("has reactStrictMode enabled", () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it("exports a valid Next.js configuration object", () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe("object");
  });
});


import nextConfig from "../../next.config";

describe("next.config security headers", () => {
  it("applies baseline hardening headers to every route", async () => {
    expect(nextConfig.headers).toBeDefined();

    const rules = await nextConfig.headers!();

    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe("/:path*");
    expect(Object.fromEntries(rules[0].headers.map((header) => [header.key, header.value]))).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://localhost:3001 https:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
  });

  it("exports a valid Next.js configuration object", () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe("object");
  });
});

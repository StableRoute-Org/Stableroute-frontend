import nextConfig from "../../next.config";

describe("next.config security headers", () => {
  it("applies baseline hardening headers to every route", async () => {
    const headers = await nextConfig.headers?.();
    expect(headers).toBeDefined();
    expect(headers).toHaveLength(1);

    const [allRoutes] = headers ?? [];
    expect(allRoutes.source).toBe("/(.*)");
    expect(allRoutes.headers).toEqual(
      expect.arrayContaining([
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ]),
    );
  });
});

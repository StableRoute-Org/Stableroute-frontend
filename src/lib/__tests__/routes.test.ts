import { ROUTES } from "../routes";

describe("routes catalogue", () => {
  const entries = Object.entries(ROUTES);

  it("has the expected set of route keys", () => {
    const keys = Object.keys(ROUTES);
    expect(keys).toEqual([
      "home",
      "pairs",
      "quote",
      "stats",
      "admin",
      "events",
      "webhooks",
      "apiKeys",
      "settings",
      "docs",
    ]);
  });

  it("has every route entry with a non-empty description", () => {
    for (const [key, route] of entries) {
      expect(route).toHaveProperty("description");
      expect(typeof route.description).toBe("string");
      expect(route.description.length).toBeGreaterThan(0);
    }
  });

  it("has unique href values across all routes", () => {
    const hrefs = entries.map(([, r]) => r.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("has unique title values across all routes", () => {
    const titles = entries.map(([, r]) => r.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it("has unique description values across all routes", () => {
    const descriptions = entries.map(([, r]) => r.description);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(descriptions.length);
  });

  it("has hrefs that start with a leading slash", () => {
    for (const [, route] of entries) {
      expect(route.href).toMatch(/^\//);
    }
  });

  it("has no route with an empty href", () => {
    for (const [, route] of entries) {
      expect(route.href.length).toBeGreaterThan(0);
    }
  });

  it("has entries with all three required fields (href, title, description)", () => {
    for (const [, route] of entries) {
      expect(route).toEqual(
        expect.objectContaining({
          href: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
        }),
      );
      // No extra unexpected keys
      expect(Object.keys(route).sort()).toEqual(
        ["description", "href", "title"],
      );
    }
  });
});

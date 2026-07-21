import { ROUTES, getRoutesByGroup, type RouteGroup } from '../routes';

const VALID_GROUPS: RouteGroup[] = ['Routing', 'Operations', 'Reference'];

describe('routes catalogue', () => {
  const entries = Object.entries(ROUTES);

  it('has the expected set of route keys', () => {
    const keys = Object.keys(ROUTES);
    expect(keys).toEqual([
      'home',
      'pairs',
      'quote',
      'stats',
      'admin',
      'events',
      'webhooks',
      'apiKeys',
      'settings',
      'docs',
    ]);
  });

  it('has every route entry with a non-empty description', () => {
    for (const [, route] of entries) {
      expect(route).toHaveProperty('description');
      expect(typeof route.description).toBe('string');
      expect(route.description.length).toBeGreaterThan(0);
    }
  });

  it('has unique href values across all routes', () => {
    const hrefs = entries.map(([, r]) => r.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it('has unique title values across all routes', () => {
    const titles = entries.map(([, r]) => r.title);
    const unique = new Set(titles);
    expect(unique.size).toBe(titles.length);
  });

  it('has unique description values across all routes', () => {
    const descriptions = entries.map(([, r]) => r.description);
    const unique = new Set(descriptions);
    expect(unique.size).toBe(descriptions.length);
  });

  it('has hrefs that start with a leading slash', () => {
    for (const [, route] of entries) {
      expect(route.href).toMatch(/^\//);
    }
  });

  it('has no route with an empty href', () => {
    for (const [, route] of entries) {
      expect(route.href.length).toBeGreaterThan(0);
    }
  });

  it('has entries with all four required fields (href, title, description, group)', () => {
    for (const [, route] of entries) {
      expect(route).toEqual(
        expect.objectContaining({
          href: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
          group: expect.any(String),
        })
      );
      // No extra unexpected keys
      expect(Object.keys(route).sort()).toEqual([
        'description',
        'group',
        'href',
        'title',
      ]);
    }
  });

  it('assigns every route a valid group', () => {
    for (const [, route] of entries) {
      expect(VALID_GROUPS).toContain(route.group);
    }
  });
});

describe('getRoutesByGroup', () => {
  it('assigns every route to exactly one group', () => {
    const grouped = getRoutesByGroup();
    const hrefs = grouped.flatMap(({ routes }) => routes.map((r) => r.href));
    const allHrefs = Object.values(ROUTES).map((r) => r.href);

    // Same routes, no duplicates, none dropped.
    expect(hrefs.sort()).toEqual(allHrefs.sort());
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('returns groups in the order they first appear in ROUTES', () => {
    const declarationOrder: RouteGroup[] = [];
    for (const route of Object.values(ROUTES)) {
      if (!declarationOrder.includes(route.group))
        declarationOrder.push(route.group);
    }

    const grouped = getRoutesByGroup();
    expect(grouped.map((g) => g.group)).toEqual(declarationOrder);
  });

  it("preserves each route's declaration order within its group", () => {
    const grouped = getRoutesByGroup();
    for (const { group, routes } of grouped) {
      const expected = Object.values(ROUTES)
        .filter((r) => r.group === group)
        .map((r) => r.href);
      expect(routes.map((r) => r.href)).toEqual(expected);
    }
  });

  it('does not create an entry for a group with no routes', () => {
    const grouped = getRoutesByGroup();
    for (const { routes } of grouped) {
      expect(routes.length).toBeGreaterThan(0);
    }
  });

  it('is stable across repeated calls', () => {
    expect(getRoutesByGroup()).toEqual(getRoutesByGroup());
  });
});

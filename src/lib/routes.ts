export type RouteGroup = "Routing" | "Operations" | "Reference";

export const ROUTES = {
  home: {
    href: "/",
    title: "Home",
    description: "StableRoute dashboard landing page.",
    group: "Routing",
  },
  pairs: {
    href: "/pairs",
    title: "Pairs",
    description: "Manage registered routing pairs.",
    group: "Routing",
  },
  quote: {
    href: "/quote",
    title: "Quote",
    description: "Request routing quotes.",
    group: "Routing",
  },
  stats: {
    href: "/stats",
    title: "Stats",
    description: "View router metrics.",
    group: "Routing",
  },
  admin: {
    href: "/admin",
    title: "Admin",
    description: "Pause or resume the router.",
    group: "Operations",
  },
  events: {
    href: "/events",
    title: "Events",
    description: "Inspect router event log.",
    group: "Operations",
  },
  webhooks: {
    href: "/webhooks",
    title: "Webhooks",
    description: "Register webhook endpoints.",
    group: "Operations",
  },
  apiKeys: {
    href: "/api-keys",
    title: "API keys",
    description: "Manage operator API keys.",
    group: "Operations",
  },
  settings: {
    href: "/settings",
    title: "Settings",
    description: "Appearance and API configuration.",
    group: "Reference",
  },
  docs: {
    href: "/docs",
    title: "Docs",
    description: "HTTP API reference.",
    group: "Reference",
  },
} as const satisfies Record<
  string,
  { href: string; title: string; description: string; group: RouteGroup }
>;

export type RouteEntry = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Group every ROUTES entry by its `group` field. Both the order groups
 * first appear in and each route's order within its group follow ROUTES'
 * own declaration order, so Header/CommandPalette render sections in a
 * stable, predictable sequence without needing a separate ordering config.
 */
export function getRoutesByGroup(): Array<{ group: RouteGroup; routes: RouteEntry[] }> {
  const groupOrder: RouteGroup[] = [];
  const byGroup = new Map<RouteGroup, RouteEntry[]>();

  for (const route of Object.values(ROUTES)) {
    if (!byGroup.has(route.group)) {
      byGroup.set(route.group, []);
      groupOrder.push(route.group);
    }
    byGroup.get(route.group)!.push(route);
  }

  return groupOrder.map((group) => ({ group, routes: byGroup.get(group)! }));
}

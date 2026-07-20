export const ROUTES = {
  home: { href: "/", title: "Home", description: "StableRoute dashboard landing page." },
  pairs: { href: "/pairs", title: "Pairs", description: "Manage registered routing pairs." },
  quote: { href: "/quote", title: "Quote", description: "Request routing quotes." },
  stats: { href: "/stats", title: "Stats", description: "View router metrics." },
  admin: { href: "/admin", title: "Admin", description: "Pause or resume the router." },
  events: { href: "/events", title: "Events", description: "Inspect router event log." },
  webhooks: { href: "/webhooks", title: "Webhooks", description: "Register webhook endpoints." },
  apiKeys: { href: "/api-keys", title: "API keys", description: "Manage operator API keys." },
  settings: { href: "/settings", title: "Settings", description: "Appearance and API configuration." },
  docs: { href: "/docs", title: "Docs", description: "HTTP API reference." },
} as const;

import Link from "next/link";
import { Card } from "@/components/Card";

const routes = [
  { href: "/quote", label: "Get a Quote", desc: "Find the best path for stablecoin payments and cross-currency swaps" },
  { href: "/pairs", label: "Manage Pairs", desc: "Register and monitor liquidity pairs on the router" },
  { href: "/stats", label: "View Stats", desc: "System metrics, routing performance and pair status" },
  { href: "/admin", label: "Admin", desc: "Router pause/unpause and operational controls" },
  { href: "/api-keys", label: "API Keys", desc: "Create, list, and revoke API access keys" },
  { href: "/events", label: "Events", desc: "Audit log of system events and activity" },
  { href: "/webhooks", label: "Webhooks", desc: "Manage webhook subscriptions for event notifications" },
  { href: "/docs", label: "Docs", desc: "API endpoints reference and usage guides" },
];

export default function Home() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen flex flex-col items-center gap-4 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-bold tracking-tight text-center">
        StableRoute
      </h1>
      <p className="mt-2 text-lg text-center text-neutral-600">
        Liquidity Router for Stellar
      </p>
      <p className="mt-2 text-sm text-neutral-500 max-w-md text-center">
        Operator dashboard for managing routing pairs, quotes, system
        configuration, API keys, webhooks, and event monitoring.
      </p>
      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {routes.map((r) => (
          <Link key={r.href} href={r.href} className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 rounded-lg">
            <Card title={r.label}>
              <p className="text-sm text-neutral-500">{r.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}

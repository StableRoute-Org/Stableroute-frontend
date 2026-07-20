import { StatsClient } from "./Client";

type Stats = { totalPairs: number; paused: boolean };

async function getStats(): Promise<Stats> {
  const base =
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";
  const res = await fetch(`${base}/api/v1/stats`, {
    next: { revalidate: 5 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export default async function StatsPage() {
  let initial: Stats | null = null;
  let error: string | null = null;
  try {
    initial = await getStats();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <StatsClient initial={initial} error={error} />
    </main>
  );
}

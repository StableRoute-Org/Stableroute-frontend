import { Spinner } from "@/components/Spinner";

export default function StatsLoading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Stats</h1>
      <div className="flex items-center gap-2 text-sm text-neutral-600">
        <Spinner label="Loading stats" />
        Loading…
      </div>
      <section>
        <dl className="grid grid-cols-2 gap-4">
          <div className="h-[90px] animate-pulse rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
          <div className="h-[90px] animate-pulse rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
        </dl>
      </section>
    </main>
  );
}

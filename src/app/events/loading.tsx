import { Spinner } from "@/components/Spinner";

export default function EventsLoading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-4xl flex-col gap-6 p-8 focus:outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Event log</h1>
        <div className="flex items-center gap-2">
          <div className="h-[34px] w-24 animate-pulse rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
          <div className="h-[34px] w-20 animate-pulse rounded-full border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800" />
        </div>
      </div>
      <div className="h-5 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="flex max-w-sm flex-col gap-1 text-sm">
        <span>Filter by event type</span>
        <div className="h-[38px] w-full animate-pulse rounded-md border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
      </div>
      <section className="contents">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Spinner label="Loading events" />
          Loading…
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div className="h-[104px] w-full animate-pulse rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
          <div className="h-[104px] w-full animate-pulse rounded border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900" />
        </div>
      </section>
    </main>
  );
}

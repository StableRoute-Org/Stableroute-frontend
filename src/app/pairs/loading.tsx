import { PageHeading } from "@/components/PageHeading";
import { Spinner } from "@/components/Spinner";

export default function PairsLoading() {
  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none">
      <PageHeading
        title="Pairs"
        description="Registered routing pairs for the StableRoute router."
        action={
          <div className="h-[36px] w-[90px] animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
        }
      />
      <div className="flex flex-col gap-1 text-sm">
        <span>Filter pairs</span>
        <div className="h-[38px] w-full animate-pulse rounded-md border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900" />
      </div>
      <section className="contents">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Spinner label="Loading pairs" />
          Loading…
        </div>
        <div className="flex flex-col gap-6 mt-4">
          <section>
            <div className="mb-2 h-7 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-32 w-full animate-pulse rounded-lg border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900" />
          </section>
        </div>
      </section>
    </main>
  );
}

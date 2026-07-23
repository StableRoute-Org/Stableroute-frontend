export default function Loading() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-4 p-8 focus:outline-none"
    >
      <div className="h-6 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-80 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-4 w-72 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
    </main>
  );
}

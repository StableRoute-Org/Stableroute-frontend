import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 p-8 text-center focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        That page does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        Back to home
      </Link>
    </main>
  );
}

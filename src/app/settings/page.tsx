import { ThemeToggle } from "@/components/ThemeToggle";
import { Card } from "@/components/Card";

export const metadata = { title: "Settings — StableRoute" };

/** Retrieves the current API base URL from environment variables or defaults to localhost. */
const getApiBase = () => process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";

export default function SettingsPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-8 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Appearance</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Choose a colour scheme. System follows your OS preference.
        </p>
        <div className="flex flex-col gap-6">
          <ThemeToggle />
          
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="mb-2 text-xs font-medium uppercase text-neutral-500">Preview</p>
            <div className="flex gap-4">
              <div className="flex flex-col gap-1 rounded border border-neutral-300 bg-white p-3 text-xs dark:border-neutral-700 dark:bg-neutral-900">
                <span className="font-semibold">Light / Dark</span>
                <span className="text-neutral-500">Sample surface text.</span>
              </div>
              <div className="flex flex-col gap-1 rounded border border-neutral-300 bg-neutral-100 p-3 text-xs dark:border-neutral-700 dark:bg-neutral-800">
                <span className="font-semibold">Contrast</span>
                <span className="text-neutral-500">Sample surface text.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Backend</h2>
        <Card title="API Configuration">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">API Base URL</span>
            <code className="rounded bg-neutral-100 px-2 py-1 font-mono text-xs dark:bg-neutral-800">
              {getApiBase()}
            </code>
          </div>
          <footer className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
            This is a read-only value configured via environment variables.
          </footer>
        </Card>
      </section>
    </main>
  );
}

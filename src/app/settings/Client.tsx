import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readTheme, effectiveTheme, type Theme } from "@/lib/theme";
import { useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE || "http://localhost:3001";

function ApiBaseRow() {
  return (
    <Card title="API Base">
      <p className="text-sm text-neutral-600 dark:text-neutral-400 font-mono">
        {API_BASE}
      </p>
    </Card>
  );
}

function AppearancePreview() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(readTheme());
    const handler = () => setTheme(readTheme());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const resolved = effectiveTheme(theme);
  const bg = resolved === "dark" ? "bg-neutral-800" : "bg-white";
  const text = resolved === "dark" ? "text-neutral-100" : "text-neutral-900";
  const muted = resolved === "dark" ? "text-neutral-400" : "text-neutral-500";
  const border = resolved === "dark" ? "border-neutral-700" : "border-neutral-200";

  return (
    <Card title="Appearance Preview">
      <div
        className={`rounded-md border ${border} ${bg} ${text} p-4 transition-colors`}
      >
        <p className="text-sm font-medium">Sample Text</p>
        <p className={`mt-1 text-xs ${muted}`}>
          This is how content appears in the current theme.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="inline-flex h-5 w-5 rounded-full bg-blue-500" />
          <span className="inline-flex h-5 w-5 rounded-full bg-neutral-300 dark:bg-neutral-600" />
        </div>
      </div>
    </Card>
  );
}

export default function SettingsClient() {
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
        <ThemeToggle />
      </section>
      <AppearancePreview />
      <ApiBaseRow />
    </main>
  );
}

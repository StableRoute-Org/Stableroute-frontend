"use client";

import { Card } from "@/components/Card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { readTheme, effectiveTheme, type Theme } from "@/lib/theme";
import { getApiBase } from "@/lib/config";
import { useApi } from "@/lib/useApi";
import { useEffect, useState } from "react";

function ApiBaseRow() {
  return (
    <Card title="API Base">
      <p className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
        {getApiBase()}
      </p>
    </Card>
  );
}

type RouterStatus = { paused: boolean };

function RouterStatusRow() {
  const status = useApi<RouterStatus>("/api/v1/admin/status");

  return (
    <Card title="Router status">
      <div className="flex items-center justify-between gap-3">
        {status.status === "loading" && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading…</p>
        )}
        {status.status === "error" && (
          <p role="alert" className="text-sm text-rose-600">
            {status.error}
          </p>
        )}
        {status.status === "ok" && status.data && (
          <p className="text-sm">
            Router is <strong>{status.data.paused ? "Paused" : "Live"}</strong>
          </p>
        )}
        <button
          type="button"
          onClick={status.refetch}
          className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700"
        >
          Refresh
        </button>
      </div>
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
      <RouterStatusRow />
      <ApiBaseRow />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/apiClient";
import { Button } from "@/components/Button";

export default function AdminPage() {
  const [paused, setPaused] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    apiGet<{ paused: boolean }>("/api/v1/admin/status")
      .then((b) => setPaused(b.paused))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  /** Toggle the router paused state, disabling the control while the request is in flight. */
  const toggle = async () => {
    setError(null);
    setBusy(true);
    try {
      await apiPost(paused ? "/api/v1/admin/unpause" : "/api/v1/admin/pause", {});
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      {paused === null && !error && <p>Loading status…</p>}
      {paused !== null && (
        <section className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <p>
            Status: <strong>{paused ? "Paused" : "Live"}</strong>
          </p>
          <Button
            type="button"
            onClick={toggle}
            aria-pressed={paused}
            aria-busy={busy}
            disabled={busy}
          >
            {paused ? "Unpause" : "Pause"}
          </Button>
        </section>
      )}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
    </main>
  );
}

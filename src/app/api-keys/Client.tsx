"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";
import { TimeAgo } from "@/components/TimeAgo";
import { Badge } from "@/components/Badge";
import { apiDelete, apiGet, apiPost } from "@/lib/apiClient";
import { useList } from "@/lib/useList";

/** Secret auto-clear timeout in milliseconds (30 seconds). */
const SECRET_DISPLAY_DURATION_MS = 30_000;

type Item = { prefix: string; label: string; createdAt: number };

export default function ApiKeysClient() {
  const loadItems = useCallback(
    () => apiGet<{ items: Item[] }>("/api/v1/api-keys").then((body) => body.items),
    [],
  );
  const { items, error, loading, reload } = useList(loadItems);
  const [label, setLabel] = useState("");
  /**
   * The full API key secret, shown once immediately after creation.
   * Cleared on dismiss, auto-clear timeout, copy, or reload.
   * The secret is never persisted to localStorage, the URL, logs, or analytics.
   */
  const [created, setCreated] = useState<string | null>(null);
  /** The prefix of the most recently created API key, used to mark its row with a "New" badge. Persists until page reload or navigation. */
  const [recentPrefix, setRecentPrefix] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  /**
   * Auto-clear the created secret after `SECRET_DISPLAY_DURATION_MS`.
   * Timer is reset whenever `created` changes (including to null).
   */
  useEffect(() => {
    if (!created) return;
    const timer = setTimeout(() => setCreated(null), SECRET_DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, [created]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiPost<{ key: string; prefix?: string }>("/api/v1/api-keys", { label });
      setCreated(response.key);
      setRecentPrefix(response.prefix ?? response.key.slice(0, 8));
      setLabel("");
      await reload();
    } catch (err) {
      /* surfaced via useList error if reload fails; keep form local */
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created);
      setCreated(null);
    } catch {
      /* ignore in jsdom */
    }
  };

  /**
   * Dismisses the one-time API key secret from the UI.
   * Called by the dismiss button or triggered automatically
   * after {@link SECRET_DISPLAY_DURATION_MS} via the auto-clear timer.
   */
  const dismissSecret = () => setCreated(null);

  const secretVisible = created && typeof window !== "undefined" && window.isSecureContext;

  /** True when the page is served over plain HTTP (and not localhost development). */
  const isInsecure =
    typeof window !== "undefined" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
      <form onSubmit={onCreate} className="flex items-end gap-2">
        <TextField
          label="Label"
          required
          maxLength={64}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Production operator"
          className="flex-1"
        />
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
      </form>
      {created && !secretVisible && !isInsecure && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          API secrets are only shown over HTTPS in a secure browser context.
        </p>
      )}
      {created && isInsecure && (
        <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">
          Warning: Your API secret is being displayed over an insecure connection (HTTP).
          The secret could be intercepted in transit. Use HTTPS in production.
        </p>
      )}
      {secretVisible && (
        <div role="status" className="flex items-start justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          <div>
            <p className="font-medium">Copy now — shown only once:</p>
            <code className="break-all">{created}</code>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <IconButton label="Copy API key secret" onClick={() => void copySecret()}>
              ⧉
            </IconButton>
            <IconButton label="Dismiss API key secret" onClick={dismissSecret}>
              ✕
            </IconButton>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      <div aria-live="polite" aria-atomic="true">
        {loading && !items && <p>Loading…</p>}
        {items && items.length === 0 && <p className="text-sm text-neutral-600">No API keys yet.</p>}
        {items && items.length > 0 && (
          <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {items.map((key) => (
              <li key={key.prefix} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{key.label}</p>
                    {key.prefix === recentPrefix && <Badge variant="ok">New</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-neutral-500">
                      {revealedKeys.has(key.prefix) ? key.prefix : `${key.prefix.slice(0, 8)}••••••••`}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRevealedKeys((prev) => {
                          const next = new Set(prev);
                          if (next.has(key.prefix)) {
                            next.delete(key.prefix);
                          } else {
                            next.add(key.prefix);
                          }
                          return next;
                        });
                      }}
                      aria-label={`${revealedKeys.has(key.prefix) ? "Hide" : "Reveal"} API key ${key.label}`}
                      className="text-xs text-neutral-500 hover:text-neutral-900 underline dark:hover:text-neutral-100"
                    >
                      {revealedKeys.has(key.prefix) ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-500">
                    Created <TimeAgo ts={key.createdAt} />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingRevoke(key.prefix)}
                  className="rounded border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ConfirmDialog
        open={pendingRevoke !== null}
        tone="danger"
        title="Revoke API key?"
        confirmLabel="Revoke"
        onConfirm={() => {
          const prefix = pendingRevoke;
          setPendingRevoke(null);
          if (prefix) void apiDelete(`/api/v1/api-keys/${prefix}`).then(() => reload());
        }}
        onCancel={() => setPendingRevoke(null)}
      />
    </main>
  );
}

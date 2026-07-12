"use client";

import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { IconButton } from "@/components/IconButton";
import { TextField } from "@/components/TextField";
import { TimeAgo } from "@/components/TimeAgo";
import { Badge } from "@/components/Badge";
import { apiDelete, apiGet, apiPost } from "@/lib/apiClient";
import { useList } from "@/lib/useList";

type Item = { prefix: string; label: string; createdAt: number };

export default function ApiKeysClient() {
  const loadItems = useCallback(
    () => apiGet<{ items: Item[] }>("/api/v1/api-keys").then((body) => body.items),
    [],
  );
  const { items, error, loading, reload } = useList(loadItems);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [recentPrefix, setRecentPrefix] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRevoke, setPendingRevoke] = useState<string | null>(null);

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

  const secretVisible = created && typeof window !== "undefined" && window.isSecureContext;

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
      {created && !secretVisible && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          API secrets are only shown over HTTPS in a secure browser context.
        </p>
      )}
      {secretVisible && (
        <div role="status" className="flex items-start justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          <div>
            <p className="font-medium">Copy now — shown only once:</p>
            <code className="break-all">{created}</code>
          </div>
          <IconButton label="Copy API key secret" onClick={() => void copySecret()}>
            ⧉
          </IconButton>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
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
                <p className="font-mono text-xs text-neutral-500">{key.prefix}…</p>
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

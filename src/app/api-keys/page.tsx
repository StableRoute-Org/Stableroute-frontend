"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { useToast } from "@/components/ToastProvider";
import { apiGet, apiPost, apiDelete } from "@/lib/apiClient";

type Item = { prefix: string; label: string; createdAt: number };

/**
 * Copy sensitive text without logging or persisting it beyond the caller's state.
 */
async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.top = "-1000px";
  document.body.appendChild(input);
  input.select();
  const copied = typeof document.execCommand === "function" && document.execCommand("copy");
  document.body.removeChild(input);

  if (!copied) {
    throw new Error("Clipboard is not available");
  }
}

export default function ApiKeysPage() {
  const toast = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const [label, setLabel] = useState("");
  const [created, setCreated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const load = () =>
    apiGet<{ items: Item[] }>("/api/v1/api-keys")
      .then((b) => setItems(b.items))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const r = await apiPost<{ key: string }>("/api/v1/api-keys", { label });
      setCreated(r.key);
      setLabel("");
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const onCopyCreatedKey = async () => {
    if (!created || copying) return;
    setCopying(true);
    try {
      await copyTextToClipboard(created);
      toast.push("API key copied");
    } catch {
      toast.push("Could not copy API key", "error");
    } finally {
      setCopying(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">API keys</h1>
      <form onSubmit={onCreate} className="flex gap-2">
        <input
          required
          maxLength={64}
          aria-label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Create
        </button>
      </form>
      {created && (
        <div role="status" className="rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
          <p className="font-medium">Copy now — shown only once:</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="break-all">{created}</code>
            <Button
              type="button"
              variant="secondary"
              onClick={onCopyCreatedKey}
              disabled={copying}
              className="self-start"
            >
              {copying ? "Copying…" : "Copy"}
            </Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
      {items && (
        <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {items.map((k) => (
            <li key={k.prefix} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium">{k.label}</p>
                <p className="font-mono text-xs text-neutral-500">{k.prefix}…</p>
              </div>
              <button
                type="button"
                onClick={() => apiDelete(`/api/v1/api-keys/${k.prefix}`).then(() => load())}
                className="rounded border border-neutral-300 px-3 py-1 text-xs hover:border-rose-500 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

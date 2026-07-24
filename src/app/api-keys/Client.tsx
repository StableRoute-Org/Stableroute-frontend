'use client';

import { useCallback, useState } from 'react';
import { IconButton } from '@/components/IconButton';
import { ResourceList } from '@/components/ResourceList';
import { TextField } from '@/components/TextField';
import { TimeAgo } from '@/components/TimeAgo';
import { Badge } from '@/components/Badge';
import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';
import { useList } from '@/lib/useList';
import { writeToClipboard } from '@/lib/clipboard';
import { useToast } from '@/components/ToastProvider';
import type { ApiKey, CreateApiKeyResponse } from '@/lib/types';
import { isApiKeyListResponse, isCreateApiKeyResponse } from '@/lib/validate';

export default function ApiKeysClient() {
  const loadItems = useCallback(
    () =>
      apiGet<{ items: ApiKey[] }>('/api/v1/api-keys', {
        validate: isApiKeyListResponse,
      }).then((body) => body.items),
    []
  );
  const itemsResult = useList(loadItems);
  const [label, setLabel] = useState('');
  /** The full API key secret, shown once immediately after creation. Cleared after copy or when reloading. */
  const [created, setCreated] = useState<string | null>(null);
  /** The prefix of the most recently created API key, used to mark its row with a "New" badge. Persists until page reload or navigation. */
  const [recentPrefix, setRecentPrefix] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const { push } = useToast();
  const items = itemsResult.status === 'success' ? itemsResult.data : null;
  const loading =
    itemsResult.status === 'idle' || itemsResult.status === 'loading';

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiPost<CreateApiKeyResponse>(
        '/api/v1/api-keys',
        { label },
        { validate: isCreateApiKeyResponse }
      );
      setCreated(response.key);
      setCopyFailed(false);
      setRecentPrefix(response.prefix ?? response.key.slice(0, 8));
      setLabel('');
      await itemsResult.refetch();
    } catch (err) {
      /* surfaced via useList error if refetch fails; keep form local */
    } finally {
      setSubmitting(false);
    }
  };

  const copySecret = async () => {
    if (!created) return;
    const result = await writeToClipboard(created);
    if (result.ok) {
      setCreated(null);
      setCopyFailed(false);
      return;
    }
    // Keep the secret on screen and expose a selectable fallback field so the
    // key can still be copied manually after an automatic copy fails.
    setCopyFailed(true);
    push(
      "Couldn't copy automatically. Select and copy the key below.",
      'error'
    );
  };

  const secretVisible =
    created && typeof window !== 'undefined' && window.isSecureContext;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8"
    >
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
          {submitting ? 'Creating…' : 'Create'}
        </button>
      </form>
      {created && !secretVisible && (
        <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">
          API secrets are only shown over HTTPS in a secure browser context.
        </p>
      )}
      {secretVisible && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950"
        >
          <div>
            <p className="font-medium">Copy now — shown only once:</p>
            <code className="break-all">{created}</code>
          </div>
          <IconButton
            label="Copy API key secret"
            onClick={() => void copySecret()}
          >
            ⧉
          </IconButton>
        </div>
      )}
      {created && copyFailed && (
        <label className="block text-sm">
          <span className="mb-1 block">Select and copy your API key:</span>
          <input
            aria-label="API key secret"
            readOnly
            value={created}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded border p-2 font-mono text-xs"
          />
        </label>
      )}
      {itemsResult.status === 'error' && (
        <p role="alert" className="text-sm text-rose-600">
          {itemsResult.error}
        </p>
      )}
      <ResourceList
        items={items}
        loading={loading}
        emptyMessage="No API keys yet."
        getKey={(key) => key.prefix}
        rowClassName="flex items-center justify-between py-3"
        removeDialogTitle="Revoke API key?"
        removeDialogConfirmLabel="Revoke"
        onRemove={(key) =>
          void apiDelete(`/api/v1/api-keys/${key.prefix}`).then(() =>
            itemsResult.refetch()
          )
        }
        renderRow={(key, { requestRemove }) => (
          <>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{key.label}</p>
                {key.prefix === recentPrefix && <Badge variant="ok">New</Badge>}
              </div>
              <p className="font-mono text-xs text-neutral-500">
                {key.prefix}…
              </p>
              <p className="text-xs text-neutral-500">
                Created <TimeAgo ts={key.createdAt} />
              </p>
            </div>
            <button
              type="button"
              onClick={requestRemove}
              className="rounded border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
            >
              Revoke
            </button>
          </>
        )}
      />
    </main>
  );
}

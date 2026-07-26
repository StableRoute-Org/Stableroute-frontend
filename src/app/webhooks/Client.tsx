'use client';

import { useCallback, useState } from 'react';
import { Badge } from '@/components/Badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { ResourceList } from '@/components/ResourceList';
import { TextField } from '@/components/TextField';
import { TimeAgo } from '@/components/TimeAgo';
import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';
import { useList } from '@/lib/useList';
import { WEBHOOK_EVENT_OPTIONS } from '@/lib/webhookEvents';
import type { Webhook } from '@/lib/types';
import { isWebhookListResponse } from '@/lib/validate';

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export default function WebhooksClient() {
  const loadHooks = useCallback(
    () =>
      apiGet<{ items: Webhook[] }>('/api/v1/webhooks', {
        validate: isWebhookListResponse,
      }).then((body) => body.items),
    []
  );
  const hooks = useList(loadHooks);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'pair.registered',
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmRegister, setConfirmRegister] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isLoading = hooks.status === 'loading';
  const isError = hooks.status === 'error';
  const isEmpty = hooks.status === 'success' && hooks.data.length === 0;
  const hasData = hooks.status === 'success' && hooks.data.length > 0;
  const displayError = localError;

  const toggleEvent = (event: string) => {
    setSelectedEvents((current) =>
      current.includes(event)
        ? current.filter((entry) => entry !== event)
        : [...current, event]
    );
  };

  const registerWebhook = async () => {
    if (!isHttpsUrl(url)) {
      setLocalError('Webhook URL must use HTTPS.');
      return;
    }
    if (selectedEvents.length === 0) {
      setLocalError('Select at least one event.');
      return;
    }
    setLocalError(null);
    setSubmitting(true);
    try {
      await apiPost('/api/v1/webhooks', { url, events: selectedEvents });
      setUrl('');
      await hooks.refetch();
    } catch (err) {
      setLocalError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-3xl flex-col gap-6 p-8"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Webhooks</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setConfirmRegister(true);
        }}
        className="flex flex-col gap-3"
      >
        <TextField
          label="URL"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <fieldset>
          <legend className="text-sm font-medium">Events</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEBHOOK_EVENT_OPTIONS.map((event) => (
              <label key={event} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={selectedEvents.includes(event)}
                  onChange={() => toggleEvent(event)}
                />
                {event}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="self-start rounded-full bg-black px-5 py-2 text-sm text-white disabled:opacity-50"
        >
          {submitting ? 'Registering…' : 'Register'}
        </button>
        {displayError && (
          <p role="alert" className="text-sm text-rose-600">
            {displayError}
          </p>
        )}
      </form>
      {!hasData && (
        <div aria-live="polite" aria-atomic="true" aria-busy={isLoading}>
          {isLoading && <p>Loading…</p>}
          {isError && (
            <div
              role="alert"
              className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-800 dark:bg-rose-950"
            >
              <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                Failed to load webhooks
              </p>
              <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">
                {hooks.error}
              </p>
              <button
                type="button"
                onClick={() => {
                  void hooks.refetch();
                }}
                className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                Retry
              </button>
            </div>
          )}
          {isEmpty && (
            <EmptyState
              title="No webhooks registered"
              description="Register your first webhook endpoint using the form above."
            />
          )}
        </div>
      )}
      {hasData && (
        <ResourceList
          items={hooks.data}
          loading={false}
          emptyMessage="No webhooks registered."
          getKey={(hook) => hook.id}
          caption="Registered webhooks"
          tableHeaders={['URL', 'Events', 'Registered', 'Actions']}
          renderRow={(hook, { requestRemove }) => (
            <>
              <div>
                <p className="break-all text-sm font-medium">{hook.url}</p>
                <p className="text-xs text-neutral-500">
                  Registered <TimeAgo ts={hook.createdAt} />
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {hook.events.map((event) => (
                    <Badge key={event}>{event}</Badge>
                  ))}
                </div>
              </div>
              <IconButton label="Remove webhook" onClick={requestRemove}>
                ×
              </IconButton>
            </>
          )}
          renderCells={(hook, { requestRemove }) => [
            <span key="url" className="break-all text-sm font-medium">
              {hook.url}
            </span>,
            <div key="events" className="flex flex-wrap gap-1">
              {hook.events.map((event) => (
                <Badge key={event}>{event}</Badge>
              ))}
            </div>,
            <span key="registered" className="text-xs text-neutral-500">
              <TimeAgo ts={hook.createdAt} />
            </span>,
            <IconButton
              key="actions"
              label="Remove webhook"
              onClick={requestRemove}
            >
              ×
            </IconButton>,
          ]}
          removeDialogTitle="Remove webhook?"
          removeDialogConfirmLabel="Remove"
          onRemove={(hook) =>
            void apiDelete(`/api/v1/webhooks/${hook.id}`).then(() =>
              hooks.refetch()
            )
          }
        />
      )}
      <ConfirmDialog
        open={confirmRegister}
        tone="default"
        title="Register webhook?"
        onConfirm={() => {
          setConfirmRegister(false);
          void registerWebhook();
        }}
        onCancel={() => setConfirmRegister(false)}
      />
    </main>
  );
}

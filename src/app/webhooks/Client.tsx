'use client';

import { useCallback, useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { IconButton } from '@/components/IconButton';
import { ResourceList } from '@/components/ResourceList';
import { TextField } from '@/components/TextField';
import { TimeAgo } from '@/components/TimeAgo';
import { apiDelete, apiGet, apiPost } from '@/lib/apiClient';
import { useFormAnnouncement } from '@/lib/useFormAnnouncement';
import { useList } from '@/lib/useList';
import { WEBHOOK_EVENT_OPTIONS } from '@/lib/webhookEvents';
import type { TestDeliveryResult, Webhook } from '@/lib/types';
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
  const { message: formStatus, announce } = useFormAnnouncement();

  const [testResults, setTestResults] = useState<
    Record<
      string,
      { testing: boolean; statusCode?: number; ok?: boolean } | undefined
    >
  >({});

  const sendTestDelivery = async (hookId: string) => {
    setTestResults((prev) => ({ ...prev, [hookId]: { testing: true } }));
    try {
      const result = await apiPost<TestDeliveryResult>(
        `/api/v1/webhooks/${hookId}/test`,
        {}
      );
      setTestResults((prev) => ({
        ...prev,
        [hookId]: { testing: false, statusCode: result.statusCode, ok: result.ok },
      }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [hookId]: { testing: false, statusCode: 0, ok: false },
      }));
    }
  };

  const isLoading = hooks.status === 'loading';
  const isError = hooks.status === 'error';
  const isEmpty = hooks.status === 'success' && hooks.data.length === 0;
  const hasData = hooks.status === 'success' && hooks.data.length > 0;
  const displayError = localError;

  // Memoize the loaded webhook items so unrelated state changes (typing in the
  // URL field, toggling the confirm dialog, or localError updates) do not cause
  // the ResourceList rows to re-render. `hooks.data` is stable-by-reference
  // between refetches, so this memo only recomputes when the list actually
  // changes.
  const webhookData = hooks.status === 'success' ? hooks.data : null;
  const webhookItems = useMemo(
    () => webhookData ?? [],
    [webhookData]
  );

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
    announce('Registering webhook…');
    try {
      await apiPost('/api/v1/webhooks', { url, events: selectedEvents });
      setUrl('');
      announce('Webhook registered.');
      await hooks.refetch();
    } catch (err) {
      setLocalError((err as Error).message);
      announce('');
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
      {isLoading && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading…
        </p>
      )}
      {isError && !localError && (
        <p role="alert" className="text-sm text-rose-600">
          {hooks.error}
        </p>
      )}
      {isEmpty && (
        <EmptyState
          title="No webhooks registered"
          description="Register your first webhook endpoint using the form above."
        />
      )}
      {hasData && (
        <ResourceList
          items={webhookItems}
          loading={false}
          emptyMessage="No webhooks registered."
          getKey={(hook) => hook.id}
          announcement={formStatus || undefined}
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
                {testResults[hook.id]?.statusCode !== undefined && (
                  <p
                    className={`mt-1 text-xs ${
                      testResults[hook.id]?.ok
                        ? 'text-green-600'
                        : 'text-rose-600'
                    }`}
                  >
                    Test delivery:{' '}
                    {testResults[hook.id]?.ok ? 'OK' : 'Failed'} (
                    {testResults[hook.id]?.statusCode})
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={testResults[hook.id]?.testing}
                  aria-busy={testResults[hook.id]?.testing}
                  aria-label={`Test delivery for ${hook.url}`}
                  onClick={() => void sendTestDelivery(hook.id)}
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:border-neutral-500 disabled:opacity-50 dark:border-neutral-700"
                >
                  {testResults[hook.id]?.testing ? 'Testing…' : 'Test'}
                </button>
                <IconButton label="Remove webhook" onClick={requestRemove}>
                  ×
                </IconButton>
              </div>
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
            <div key="actions" className="flex items-center gap-2">
              <button
                type="button"
                disabled={testResults[hook.id]?.testing}
                aria-busy={testResults[hook.id]?.testing}
                aria-label={`Test delivery for ${hook.url}`}
                onClick={() => void sendTestDelivery(hook.id)}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs hover:border-neutral-500 disabled:opacity-50 dark:border-neutral-700"
              >
                {testResults[hook.id]?.testing ? 'Testing…' : 'Test'}
              </button>
              {testResults[hook.id]?.statusCode !== undefined && (
                <span
                  className={`text-xs ${
                    testResults[hook.id]?.ok
                      ? 'text-green-600'
                      : 'text-rose-600'
                  }`}
                >
                  {testResults[hook.id]?.ok ? 'OK' : 'Failed'} (
                  {testResults[hook.id]?.statusCode})
                </span>
              )}
              <IconButton label="Remove webhook" onClick={requestRemove}>
                ×
              </IconButton>
            </div>,
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

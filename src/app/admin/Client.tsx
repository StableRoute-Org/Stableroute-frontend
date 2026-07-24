'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { apiGet, apiPost } from '@/lib/apiClient';
import { isRouterStatus } from '@/lib/validate';

export default function AdminClient() {
  const [paused, setPaused] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmPause, setConfirmPause] = useState(false);

  const load = () =>
    apiGet<{ paused: boolean }>('/api/v1/admin/status', {
      validate: isRouterStatus,
    })
      .then((body) => setPaused(body.paused))
      .catch((err) => setError((err as Error).message));

  useEffect(() => {
    load();
  }, []);

  const applyToggle = async () => {
    if (busy || paused === null) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(
        paused ? '/api/v1/admin/unpause' : '/api/v1/admin/pause',
        {}
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onToggleClick = () => {
    if (busy || paused === null) return;
    if (paused) {
      void applyToggle();
      return;
    }
    setConfirmPause(true);
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
        <section
          aria-labelledby="admin-status-heading"
          className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <h2 id="admin-status-heading" className="sr-only">
            Router pause status
          </h2>
          <div className="flex items-center gap-2">
            <p>Status:</p>
            <Badge variant={paused ? 'warning' : 'ok'}>
              {paused ? 'Paused' : 'Live'}
            </Badge>
          </div>
          <Button
            type="button"
            onClick={onToggleClick}
            disabled={busy}
            aria-pressed={paused}
            aria-busy={busy}
          >
            {busy ? 'Updating…' : paused ? 'Unpause' : 'Pause'}
          </Button>
        </section>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirmPause}
        tone="danger"
        title="Pause routing?"
        confirmLabel="Pause router"
        onConfirm={() => {
          setConfirmPause(false);
          void applyToggle();
        }}
        onCancel={() => setConfirmPause(false)}
      />
    </main>
  );
}

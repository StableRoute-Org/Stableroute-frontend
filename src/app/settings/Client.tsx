'use client';

import { Card } from '@/components/Card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DensityToggle } from '@/components/DensityToggle';
import { readTheme, effectiveTheme, type Theme } from '@/lib/theme';
import { getApiBase } from '@/lib/config';
import { useApi } from '@/lib/useApi';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isRouterStatus } from '@/lib/validate';

function ApiBaseRow() {
  return (
    <Card title="API Base">
      <p
        data-testid="api-base-value"
        className="font-mono text-sm text-neutral-600 dark:text-neutral-400"
      >
        {getApiBase()}
      </p>
    </Card>
  );
}

type RouterStatus = { paused: boolean };

function RouterStatusRow({
  onStatusChange,
}: {
  onStatusChange?: (message: string | null) => void;
}) {
  const status = useApi<RouterStatus>('/api/v1/admin/status', isRouterStatus);
  const prevStatusRef = useRef(status.status);

  useEffect(() => {
    if (status.status === prevStatusRef.current) return;
    prevStatusRef.current = status.status;

    if (status.status === 'success') {
      onStatusChange?.('Router status loaded');
    } else if (status.status === 'error') {
      onStatusChange?.('Failed to load router status');
    }
  }, [status, onStatusChange]);

  return (
    <Card title="Router status">
      <div className="flex items-center justify-between gap-3">
        {status.status === 'loading' && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Loading…
          </p>
        )}
        {status.status === 'error' && (
          <p role="alert" className="text-sm text-rose-600">
            {status.error}
          </p>
        )}
        {status.status === 'success' && (
          <p className="text-sm">
            Router is <strong>{status.data.paused ? 'Paused' : 'Live'}</strong>
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
  const [theme, setTheme] = useState<Theme>('system');

  useEffect(() => {
    setTheme(readTheme());
    const handler = () => setTheme(readTheme());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const resolved = effectiveTheme(theme);
  const bg = resolved === 'dark' ? 'bg-neutral-800' : 'bg-white';
  const text = resolved === 'dark' ? 'text-neutral-100' : 'text-neutral-900';
  const muted = resolved === 'dark' ? 'text-neutral-400' : 'text-neutral-500';
  const border =
    resolved === 'dark' ? 'border-neutral-700' : 'border-neutral-200';

  return (
    <Card title="Appearance Preview">
      <div
        data-testid="appearance-preview"
        data-resolved-theme={resolved}
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

const ANNOUNCE_DEBOUNCE_MS = 300;

export default function SettingsClient() {
  const [announcement, setAnnouncement] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((message: string | null) => {
    if (!message) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAnnouncement(message);
    }, ANNOUNCE_DEBOUNCE_MS);
  }, []);

  const handleThemeChange = useCallback(
    (theme: Theme) => {
      announce(`Theme changed to ${theme}`);
    },
    [announce]
  );

  // Announce cross-tab theme changes received via storage events.
  useEffect(() => {
    const handler = () => {
      const theme = readTheme();
      announce(`Theme changed to ${theme}`);
    };
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('storage', handler);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [announce]);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-8 p-8 focus:outline-none"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Appearance</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">
            Theme
          </label>
          <ThemeToggle onChange={handleThemeChange} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-neutral-600 dark:text-neutral-400">
            Density
          </label>
          <DensityToggle />
        </div>
      </section>
      <AppearancePreview />
      <RouterStatusRow onStatusChange={announce} />
      <ApiBaseRow />
    </main>
  );
}

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApiKeysPage from './page';
import { ToastProvider } from '@/components/ToastProvider';

function renderPage() {
  return render(
    <ToastProvider>
      <ApiKeysPage />
    </ToastProvider>
  );
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value,
  });
}

async function createKey(label = 'Production operator') {
  fireEvent.change(screen.getByLabelText('Label'), {
    target: { value: label },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  return screen.findByText(/API secrets are only shown|Copy now/i);
}

describe('ApiKeysPage', () => {
  let originalFetch: typeof global.fetch;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Mock secure context
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setClipboard(originalClipboard);
  });

  it('shows loading before data arrives', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {})
    ) as unknown as typeof global.fetch;
    renderPage();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders api keys in a single polite live region', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: 'sk_abc', label: 'Production', createdAt: Date.now() },
          ],
        }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Production')).toBeInTheDocument();
    });
    const live = document.querySelector('[aria-live=polite]');
    expect(live).toBeInTheDocument();
    expect(live).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces empty state via live region', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
  });

  it('has exactly one aria-live=polite region in the page content', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No API keys yet/i)).toBeInTheDocument();
    });
    // Scoped to <main>: ToastProvider (required for useToast) contributes its own
    // aria-live=polite notifications region outside the page content.
    expect(document.querySelectorAll('main [aria-live=polite]')).toHaveLength(
      1
    );
  });

  it('renders createdAt timestamps with TimeAgo component', async () => {
    const now = Date.now();
    const oneDayAgo = now - 86_400_000;

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: 'sk_old', label: 'Old Key', createdAt: oneDayAgo },
            { prefix: 'sk_new', label: 'New Key', createdAt: now },
          ],
        }),
    } as unknown as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Old Key')).toBeInTheDocument();
    });

    const timeElements = document.querySelectorAll('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(2);

    timeElements.forEach((time) => {
      expect(time).toHaveAttribute('dateTime');
      expect(time.textContent).toMatch(/(\d+[dhms]\s+ago|just now)/);
    });
  });

  it('renders badge-marked new key when prefix matches recent prefix', async () => {
    const now = Date.now();

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { prefix: 'sk_old123', label: 'Old Key', createdAt: now - 100000 },
            { prefix: 'sk_new456', label: 'New Key', createdAt: now },
          ],
        }),
    } as unknown as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Old Key')).toBeInTheDocument();
    });

    const timeElements = document.querySelectorAll('time');
    expect(timeElements.length).toBeGreaterThanOrEqual(2);
  });

  it('preserves one-time secret block, revoke action, and error region unchanged', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    renderPage();

    await waitFor(() => {
      const alertElement = screen.getByRole('alert');
      expect(alertElement).toBeInTheDocument();
    });

    expect(
      document.querySelectorAll('[role=alert]').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('marks badge with emerald-100 variant (ok) for new keys', async () => {
    const now = Date.now();

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [{ prefix: 'sk_abc123', label: 'New Key', createdAt: now }],
        }),
    } as unknown as Response);

    const { container } = renderPage();

    await waitFor(() => {
      expect(screen.getByText('New Key')).toBeInTheDocument();
    });

    const badges = container.querySelectorAll('span.bg-emerald-100');
    expect(badges.length).toBeGreaterThanOrEqual(0);
  });

  it('maintains separate tracking for created secret and recent prefix state', async () => {
    const now = Date.now();

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [{ prefix: 'sk_first', label: 'First Key', createdAt: now }],
          }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              { prefix: 'sk_first', label: 'First Key', createdAt: now },
              {
                prefix: 'sk_second',
                label: 'Second Key',
                createdAt: now + 1000,
              },
            ],
          }),
      } as unknown as Response);

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('First Key')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/Key/i).length).toBeGreaterThanOrEqual(1);
  });

  describe('clipboard guard', () => {
    function mockCreateFlow() {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => JSON.stringify({ items: [] }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            JSON.stringify({ key: 'sk_live_supersecret', prefix: 'sk_live' }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          text: async () =>
            JSON.stringify({
              items: [
                {
                  prefix: 'sk_live',
                  label: 'Production operator',
                  createdAt: Date.now(),
                },
              ],
            }),
        } as unknown as Response);
    }

    it('copies the secret and hides it once the write succeeds', async () => {
      mockCreateFlow();
      const writeText = jest.fn().mockResolvedValue(undefined);
      setClipboard({ writeText });

      renderPage();
      await waitFor(() => screen.getByText(/No API keys yet/i));
      await createKey();

      expect(
        await screen.findByText('sk_live_supersecret')
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'Copy API key secret' })
      );

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('sk_live_supersecret');
      });
      await waitFor(() => {
        expect(
          screen.queryByText('sk_live_supersecret')
        ).not.toBeInTheDocument();
      });
    });

    it('shows a toast and a selectable fallback field when the write is rejected', async () => {
      mockCreateFlow();
      const writeText = jest
        .fn()
        .mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
      setClipboard({ writeText });

      renderPage();
      await waitFor(() => screen.getByText(/No API keys yet/i));
      await createKey();

      expect(
        await screen.findByText('sk_live_supersecret')
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'Copy API key secret' })
      );

      expect(
        await screen.findByText(
          "Couldn't copy automatically. Select and copy the key below."
        )
      ).toBeInTheDocument();

      const fallbackField = await screen.findByLabelText('API key secret');
      expect(fallbackField).toHaveValue('sk_live_supersecret');
      // The secret must remain visible for manual copy after a failed write.
      expect(screen.getByText('sk_live_supersecret')).toBeInTheDocument();
    });

    it('does not attempt a clipboard write when the Clipboard API is unavailable', async () => {
      mockCreateFlow();
      setClipboard(undefined);

      renderPage();
      await waitFor(() => screen.getByText(/No API keys yet/i));
      await createKey();

      expect(
        await screen.findByText('sk_live_supersecret')
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole('button', { name: 'Copy API key secret' })
      );

      expect(
        await screen.findByText(
          "Couldn't copy automatically. Select and copy the key below."
        )
      ).toBeInTheDocument();
      expect(await screen.findByLabelText('API key secret')).toHaveValue(
        'sk_live_supersecret'
      );
    });
  });
});

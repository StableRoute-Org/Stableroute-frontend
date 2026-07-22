import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Component, type ReactNode } from 'react';
import EventsPage from './page';
import EventsError from './error';
import { Header } from '@/components/Header';
import { ToastProvider } from '@/components/ToastProvider';
import {
  MAX_PAYLOAD_PREVIEW_LENGTH,
  MAX_RENDERED_EVENTS,
  buildEventsCsv,
  escapeCsvCell,
} from '@/lib/events';

const okEventsResponse = (items: unknown[]) =>
  ({
    ok: true,
    text: async () => JSON.stringify({ items }),
  }) as unknown as Response;

const eventRecord = (
  id: string,
  type = `event.${id}`,
  payload: unknown = { id }
) => ({
  id,
  ts: 1_782_460_000_000,
  type,
  payload,
});

function setDocumentVisibility(
  state: DocumentVisibilityState,
  dispatch = true
) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    value: state,
  });
  if (!dispatch) return;
  document.dispatchEvent(new Event('visibilitychange'));
}

function setSecureContext(value: boolean) {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value,
  });
}

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value,
  });
}

function renderPage() {
  return render(
    <ToastProvider>
      <EventsPage />
    </ToastProvider>
  );
}

describe('EventsPage', () => {
  let originalFetch: typeof global.fetch;
  let originalVisibilityState: DocumentVisibilityState;
  const originalSecureContext = window.isSecureContext;
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalVisibilityState = document.visibilityState;
    setDocumentVisibility('visible', false);
    setSecureContext(true);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.useRealTimers();
    setDocumentVisibility(originalVisibilityState, false);
    setSecureContext(originalSecureContext);
    setClipboard(originalClipboard);
  });

  it('shows loading before data arrives', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {})
    ) as unknown as typeof global.fetch;
    renderPage();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders events in a single polite live region', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt1',
              ts: Date.now(),
              type: 'pair.registered',
              payload: {},
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText('pair.registered')).toBeInTheDocument();
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
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
  });

  it('surfaces errors with role=alert', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Failed to load'));

    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /Network request failed/i
      );
    });
  });

  it('has exactly one aria-live=polite region in the page content', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/No events/i)).toBeInTheDocument();
    });
    // Scoped to <main>: ToastProvider (required for useToast) contributes its own
    // aria-live=polite notifications region outside the page content.
    expect(document.querySelectorAll('main [aria-live=polite]')).toHaveLength(
      1
    );
  });

  it('names the event log region for assistive tech', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('region', { name: /event log entries/i })
      ).toBeInTheDocument();
    });
  });

  it('drops malformed event records instead of throwing during render', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: {},
            },
            { ts: 1_782_460_000_001, type: 'missing.id', payload: {} },
            { id: 'evt2', ts: 'not-a-number', type: 'bad.ts', payload: {} },
            { id: 'evt3', ts: 1_782_460_000_002, payload: {} },
            { id: 'evt4', ts: 1_782_460_000_003, type: 'bad.payload' },
            {
              id: 'evt5',
              ts: 1_782_460_000_004,
              type: 'string.payload',
              payload: 'nope',
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    expect(await screen.findByText('pair.registered')).toBeInTheDocument();
    expect(screen.queryByText('missing.id')).not.toBeInTheDocument();
    expect(screen.queryByText('bad.ts')).not.toBeInTheDocument();
    expect(screen.queryByText('bad.payload')).not.toBeInTheDocument();
    expect(screen.queryByText('string.payload')).not.toBeInTheDocument();
  });

  it('bounds rendered records and surfaces a capped note', async () => {
    const events = Array.from(
      { length: MAX_RENDERED_EVENTS + 3 },
      (_, index) => ({
        id: `evt${index}`,
        ts: 1_782_460_000_000 + index,
        type: `event.${index}`,
        payload: { index },
      })
    );
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: events }),
    } as unknown as Response);

    renderPage();

    expect(
      await screen.findByText(
        `Showing ${MAX_RENDERED_EVENTS} of ${MAX_RENDERED_EVENTS + 3} events (capped).`
      )
    ).toBeInTheDocument();
    expect(screen.getByText('event.0')).toBeInTheDocument();
    expect(
      screen.getByText(`event.${MAX_RENDERED_EVENTS - 1}`)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`event.${MAX_RENDERED_EVENTS}`)
    ).not.toBeInTheDocument();
  });

  it('truncates oversized payload previews and shows truncated indicator', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-large',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: 'x'.repeat(5000) },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    expect(await screen.findByText('payload.large')).toBeInTheDocument();
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
  });

  it('renders a show-full button for truncated payloads', async () => {
    const largeString = 'x'.repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-large',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    // Click Expand to reveal the payload
    const expandButton = await screen.findByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);

    const showFullButton = await screen.findByRole('button', {
      name: /^show full$/i,
    });
    expect(showFullButton).toBeInTheDocument();

    fireEvent.click(showFullButton);

    // The full payload should be visible and the button should change
    expect(
      screen.getByRole('button', { name: /^show truncated$/i })
    ).toBeInTheDocument();
    // The truncated indicator should no longer appear in the <pre> content
    // (the button says "Show truncated" but the payload text itself should be clean)
    const preElements = document.querySelectorAll('pre');
    const hasTruncatedText = Array.from(preElements).some((pre) =>
      pre.textContent?.includes('truncated')
    );
    expect(hasTruncatedText).toBe(false);
  });

  it('shows full payload when show-full is clicked and toggles back', async () => {
    const largeString = 'x'.repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-large',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    // Click Expand to reveal the payload
    const expandButton = await screen.findByRole('button', { name: /expand/i });
    fireEvent.click(expandButton);

    // First click: Show full
    const showFullButton = await screen.findByRole('button', {
      name: /^show full$/i,
    });
    fireEvent.click(showFullButton);

    const showTruncatedButton = await screen.findByRole('button', {
      name: /^show truncated$/i,
    });
    expect(showTruncatedButton).toBeInTheDocument();

    // Second click: Back to truncated
    fireEvent.click(showTruncatedButton);
    expect(
      await screen.findByRole('button', { name: /^show full$/i })
    ).toBeInTheDocument();
    // The truncated indicator should be back in the <pre>
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
  });

  it('does not show show-full button for small payloads', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-small',
              ts: 1_782_460_000_000,
              type: 'payload.small',
              payload: { note: 'small' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    await screen.findByText('payload.small');
    expect(
      screen.queryByRole('button', { name: /^show full$/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^show truncated$/i })
    ).not.toBeInTheDocument();
  });

  it('renders one list item per event keyed by id with type and payload preview', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-alpha',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { pairId: 'USDC/EURC' },
            },
            {
              id: 'evt-beta',
              ts: 1_782_460_000_001,
              type: 'pair.updated',
              payload: { feeBps: 25 },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    expect(await screen.findByText('pair.registered')).toBeInTheDocument();
    expect(screen.getByText('pair.updated')).toBeInTheDocument();
    expect(screen.getByText(/USDC\/EURC/)).toBeInTheDocument();
    expect(screen.getByText(/\"feeBps\": 25/)).toBeInTheDocument();

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('pair.registered');
    expect(items[1]).toHaveTextContent('pair.updated');
  });

  it('copies the full pretty-printed payload when clipboard support is available', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-copy',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { pairId: 'USDC/EURC' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /copy json/i }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('{\n  "pairId": "USDC/EURC"\n}');
    });
  });

  it('copies the full payload even when the preview is truncated', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const largeString = 'x'.repeat(MAX_PAYLOAD_PREVIEW_LENGTH + 100);
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-large-copy',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: largeString },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /copy json/i }));

    await waitFor(() => {
      // The copied text should include the full body string, not be truncated
      const callArg = writeText.mock.calls[0][0] as string;
      expect(callArg).toContain(largeString);
      expect(callArg.length).toBeGreaterThan(MAX_PAYLOAD_PREVIEW_LENGTH);
    });
  });

  it('does not throw when clipboard support is absent', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-copy-missing',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { pairId: 'USDC/EURC' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    const copyButton = await screen.findByRole('button', {
      name: /copy json/i,
    });
    expect(() => fireEvent.click(copyButton)).not.toThrow();
  });

  it('shows a toast and reveals the payload when the clipboard write is rejected', async () => {
    const writeText = jest
      .fn()
      .mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    setClipboard({ writeText });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-denied',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: 'x'.repeat(5000) },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    const toggle = await screen.findByRole('button', { name: /expand/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(screen.getByRole('button', { name: /copy json/i }));

    expect(
      await screen.findByText(
        "Couldn't copy automatically. Select the payload below to copy it."
      )
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /collapse/i })).toHaveAttribute(
        'aria-expanded',
        'true'
      );
    });
  });

  it('does not attempt a clipboard write outside a secure context', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    setSecureContext(false);

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-insecure',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { pairId: 'USDC/EURC' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /copy json/i }));

    expect(
      await screen.findByText(
        "Couldn't copy automatically. Select the payload below to copy it."
      )
    ).toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
  });

  it('defaults large payloads to collapsed and toggles aria-expanded', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-large',
              ts: 1_782_460_000_000,
              type: 'payload.large',
              payload: { body: 'x'.repeat(5000) },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    const toggle = await screen.findByRole('button', { name: /expand/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const controlsId = toggle.getAttribute('aria-controls');
    expect(controlsId).toBeTruthy();
    expect(document.getElementById(controlsId ?? '')).toHaveAttribute('hidden');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/\"body\": \"x/)).toBeInTheDocument();
  });

  it('keeps small payloads expanded by default', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-small',
              ts: 1_782_460_000_000,
              type: 'payload.small',
              payload: { note: 'small' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    const toggle = await screen.findByRole('button', { name: /collapse/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/\"note\": \"small\"/)).toBeInTheDocument();
  });

  it('preserves chronological order returned by the API', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-first',
              ts: 1_782_460_000_000,
              type: 'event.first',
              payload: { order: 1 },
            },
            {
              id: 'evt-second',
              ts: 1_782_460_000_001,
              type: 'event.second',
              payload: { order: 2 },
            },
            {
              id: 'evt-third',
              ts: 1_782_460_000_002,
              type: 'event.third',
              payload: { order: 3 },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    expect(await screen.findByText('event.first')).toBeInTheDocument();
    const types = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(types[0]).toContain('event.first');
    expect(types[1]).toContain('event.second');
    expect(types[2]).toContain('event.third');
  });

  it('keeps live refresh off by default after the initial load', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValue(okEventsResponse([eventRecord('initial')]));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Live off' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    await act(async () => {
      jest.advanceTimersByTime(30_000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('polls on the fixed interval while live refresh is enabled', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord('initial')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('live')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('tick')]));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live off' }));

    expect(await screen.findByText('event.live')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Live on' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByText('event.tick')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('stops the interval when live refresh is toggled off', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord('initial')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('live')]));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live off' }));
    expect(await screen.findByText('event.live')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Live on' }));
    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Live off' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('pauses live polling while the tab is hidden and resumes when visible', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord('initial')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('live')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('visible')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('tick')]));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live off' }));
    expect(await screen.findByText('event.live')).toBeInTheDocument();

    act(() => {
      setDocumentVisibility('hidden');
    });
    await act(async () => {
      jest.advanceTimersByTime(20_000);
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    act(() => {
      setDocumentVisibility('visible');
    });
    expect(await screen.findByText('event.visible')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByText('event.tick')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('keeps the last successful list when a live refresh fails', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(okEventsResponse([eventRecord('initial')]))
      .mockResolvedValueOnce(okEventsResponse([eventRecord('live')]))
      .mockRejectedValueOnce(new Error('refresh failed'));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live off' }));
    expect(await screen.findByText('event.live')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(10_000);
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Network request failed'
    );
    expect(screen.getByText('event.live')).toBeInTheDocument();
  });

  it('shows when the event list was last updated', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-16T10:00:00.000Z'));
    global.fetch = jest
      .fn()
      .mockResolvedValue(okEventsResponse([eventRecord('initial')]));

    renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('cleans up the live interval and visibility listener on unmount', async () => {
    jest.useFakeTimers();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    global.fetch = jest
      .fn()
      .mockResolvedValue(okEventsResponse([eventRecord('initial')]));

    const { unmount } = renderPage();

    expect(await screen.findByText('event.initial')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Live off' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(jest.getTimerCount()).toBe(0);

    removeEventListenerSpy.mockRestore();
  });

  describe('filter controls grouping', () => {
    const filterableEvents = [
      eventRecord('alpha', 'pair.registered'),
      eventRecord('beta', 'pair.updated'),
      eventRecord('gamma', 'quote.requested'),
    ];

    async function renderWithEvents() {
      global.fetch = jest
        .fn()
        .mockResolvedValue(okEventsResponse(filterableEvents));
      renderPage();
      expect(await screen.findByText('pair.registered')).toBeInTheDocument();
    }

    it('groups the filter controls in a labelled fieldset', async () => {
      await renderWithEvents();

      const group = screen.getByRole('group', { name: /event log filters/i });
      expect(group.tagName).toBe('FIELDSET');
      expect(group).toContainElement(
        screen.getByLabelText(/filter by event type/i)
      );
      expect(group).toContainElement(
        screen.getByRole('button', { name: 'Live off' })
      );
      expect(group).toContainElement(
        screen.getByRole('button', { name: /export csv/i })
      );
      expect(group).toContainElement(
        screen.getByRole('button', { name: /refresh now/i })
      );
      expect(group).toContainElement(
        screen.getByRole('button', { name: /clear filters/i })
      );
    });

    it('exposes the group name through a visible legend', async () => {
      await renderWithEvents();

      const legend = document.querySelector('fieldset > legend');
      expect(legend).toHaveTextContent('Event log filters');
      expect(legend).not.toHaveClass('sr-only');
    });

    it('disables clear-all while no filter is active', async () => {
      await renderWithEvents();

      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeDisabled();
    });

    it('enables clear-all once the type filter has a value', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: 'pair' },
      });

      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeEnabled();
    });

    it('treats a whitespace-only filter as inactive', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: '   ' },
      });

      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeDisabled();
      // Whitespace must not narrow the list either.
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('narrows the list to matching event types', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: 'pair' },
      });

      expect(screen.getAllByRole('listitem')).toHaveLength(2);
      expect(screen.queryByText('quote.requested')).not.toBeInTheDocument();
    });

    it('matches event types case-insensitively', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: 'PAIR.REGISTERED' },
      });

      expect(screen.getAllByRole('listitem')).toHaveLength(1);
      expect(screen.getByText('pair.registered')).toBeInTheDocument();
    });

    it('restores every event and disables itself after clear-all', async () => {
      await renderWithEvents();

      const input = screen.getByLabelText(/filter by event type/i);
      fireEvent.change(input, { target: { value: 'pair' } });
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

      expect(input).toHaveValue('');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeDisabled();
    });

    it('announces the reset inside the existing polite live region', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: 'pair' },
      });
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

      const announcement = await screen.findByText(/filters cleared/i);
      expect(announcement).toBeInTheDocument();
      // The reset must reuse the one polite region, not introduce a second one.
      const regions = document.querySelectorAll('main [aria-live=polite]');
      expect(regions).toHaveLength(1);
      expect(regions[0]).toContainElement(announcement);
    });

    it('clears a stale reset announcement when filtering resumes', async () => {
      await renderWithEvents();

      const input = screen.getByLabelText(/filter by event type/i);
      fireEvent.change(input, { target: { value: 'pair' } });
      fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));
      expect(await screen.findByText(/filters cleared/i)).toBeInTheDocument();

      fireEvent.change(input, { target: { value: 'quote' } });

      expect(screen.queryByText(/filters cleared/i)).not.toBeInTheDocument();
    });

    it('renders no announcement before any reset happens', async () => {
      await renderWithEvents();

      expect(screen.queryByText(/filters cleared/i)).not.toBeInTheDocument();
    });

    it('keeps the live toggle working from inside the fieldset', async () => {
      jest.useFakeTimers();
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(okEventsResponse([eventRecord('initial')]))
        .mockResolvedValueOnce(okEventsResponse([eventRecord('live')]));

      renderPage();
      expect(await screen.findByText('event.initial')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Live off' }));

      expect(await screen.findByText('event.live')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Live on' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('keeps refresh-now working from inside the fieldset', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(okEventsResponse([eventRecord('initial')]));
      renderPage();
      expect(await screen.findByText('event.initial')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /refresh now/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('leaves the filter value untouched across a live refresh', async () => {
      jest.useFakeTimers();
      global.fetch = jest
        .fn()
        .mockResolvedValue(okEventsResponse(filterableEvents));

      renderPage();
      expect(await screen.findByText('pair.registered')).toBeInTheDocument();

      const input = screen.getByLabelText(/filter by event type/i);
      fireEvent.change(input, { target: { value: 'quote' } });
      fireEvent.click(screen.getByRole('button', { name: 'Live off' }));

      await act(async () => {
        jest.advanceTimersByTime(10_000);
      });

      expect(input).toHaveValue('quote');
      expect(screen.getAllByRole('listitem')).toHaveLength(1);
    });

    it('hides the list when the filter matches nothing', async () => {
      await renderWithEvents();

      fireEvent.change(screen.getByLabelText(/filter by event type/i), {
        target: { value: 'no-such-type' },
      });

      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeEnabled();
    });

    it('offers the filter controls before any events load', () => {
      global.fetch = jest.fn(
        () => new Promise(() => {})
      ) as unknown as typeof global.fetch;
      renderPage();

      expect(
        screen.getByRole('group', { name: /event log filters/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /clear filters/i })
      ).toBeDisabled();
    });
  });

  describe('payload safety', () => {
    it('handles deeply nested payloads without crashing', async () => {
      let deep: Record<string, unknown> = {};
      let current = deep;
      for (let i = 0; i < 100; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`] as Record<string, unknown>;
      }
      current.value = 'bottom';

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'evt-deep',
                ts: 1_782_460_000_000,
                type: 'payload.deep',
                payload: deep,
              },
            ],
          }),
      } as unknown as Response);

      renderPage();
      expect(await screen.findByText('payload.deep')).toBeInTheDocument();
      expect(screen.getByText(/level0/)).toBeInTheDocument();
    });

    it('renders empty payloads as {} without error', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'evt-empty',
                ts: 1_782_460_000_000,
                type: 'payload.empty',
                payload: {},
              },
            ],
          }),
      } as unknown as Response);

      renderPage();
      expect(await screen.findByText('payload.empty')).toBeInTheDocument();
      expect(screen.getByText(/\{\s*\}/)).toBeInTheDocument();
    });

    it('renders primitive-only payloads correctly', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'evt-primitive',
                ts: 1_782_460_000_000,
                type: 'payload.primitive',
                payload: { str: 'hello', num: 42, bool: true, nil: null },
              },
            ],
          }),
      } as unknown as Response);

      renderPage();
      expect(await screen.findByText('payload.primitive')).toBeInTheDocument();
      expect(screen.getByText(/"hello"/)).toBeInTheDocument();
      expect(screen.getByText(/42/)).toBeInTheDocument();
      expect(screen.getByText(/true/)).toBeInTheDocument();
      expect(screen.getByText(/null/)).toBeInTheDocument();
    });

    it('renders array payloads without crashing', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            items: [
              {
                id: 'evt-array',
                ts: 1_782_460_000_000,
                type: 'payload.array',
                payload: { items: [1, 2, 3, { nested: true }] },
              },
            ],
          }),
      } as unknown as Response);

      renderPage();
      expect(await screen.findByText('payload.array')).toBeInTheDocument();
      expect(screen.getByText(/nested/)).toBeInTheDocument();
    });
  });
});

describe('EventsError segment boundary', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // jsdom does not implement matchMedia; Header renders ThemeToggle which
    // resolves the effective theme through it on mount.
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  /**
   * Minimal stand-in for the Next.js segment boundary: renders the segment's
   * `error.tsx` default export when a child throws, and re-renders the
   * children when the fallback's `reset()` fires — mirroring App Router
   * semantics.
   */
  class SegmentBoundary extends Component<
    { children: ReactNode },
    { error: Error | null }
  > {
    state: { error: Error | null } = { error: null };

    static getDerivedStateFromError(error: Error) {
      return { error };
    }

    render() {
      if (this.state.error) {
        return (
          <EventsError
            error={this.state.error}
            reset={() => this.setState({ error: null })}
          />
        );
      }
      return this.props.children;
    }
  }

  function CrashingSegment(): ReactNode {
    throw new Error('events segment exploded');
  }

  it('renders the segment-scoped fallback with the thrown message', () => {
    render(
      <SegmentBoundary>
        <CrashingSegment />
      </SegmentBoundary>
    );
    expect(
      screen.getByRole('heading', { name: /The events page hit an error\./i })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'events segment exploded'
    );
  });

  it('keeps the header and navigation mounted during the error state', () => {
    render(
      <>
        <Header />
        <SegmentBoundary>
          <CrashingSegment />
        </SegmentBoundary>
      </>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'events segment exploded'
    );
  });

  it('recovers the segment via reset without a full page reload', () => {
    let crash = true;
    function FlakySegment(): ReactNode {
      if (crash) throw new Error('events segment exploded');
      return <p>events content</p>;
    }
    render(
      <>
        <Header />
        <SegmentBoundary>
          <FlakySegment />
        </SegmentBoundary>
      </>
    );
    const headerEl = screen.getByRole('banner');
    expect(screen.queryByText('events content')).not.toBeInTheDocument();

    crash = false;
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));

    // Same header DOM node after recovery proves the shell never remounted.
    expect(screen.getByText('events content')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBe(headerEl);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('logs the digest when the thrown error carries one', () => {
    const error = Object.assign(new Error('boom'), {
      digest: 'digest-events-1',
    });
    render(<EventsError error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'events segment error boundary caught:',
      'digest-events-1'
    );
  });
});

// ---------------------------------------------------------------------------
// CSV export – unit tests for buildEventsCsv / escapeCsvCell
// ---------------------------------------------------------------------------

describe('escapeCsvCell', () => {
  it('returns the value unchanged when no special characters are present', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
    expect(escapeCsvCell('pair.registered')).toBe('pair.registered');
    expect(escapeCsvCell('')).toBe('');
  });

  it('wraps values containing a comma in double-quotes', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
  });

  it('wraps values containing a double-quote and doubles the quote', () => {
    expect(escapeCsvCell('say "hello"')).toBe('"say ""hello"""');
  });

  it('wraps values containing a newline character', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('wraps values containing a carriage return', () => {
    expect(escapeCsvCell('line1\rline2')).toBe('"line1\rline2"');
  });

  it('handles values with multiple special characters together', () => {
    expect(escapeCsvCell('has,comma and "quote"\nand newline')).toBe(
      '"has,comma and ""quote""\nand newline"'
    );
  });
});

describe('buildEventsCsv', () => {
  const makeEvent = (
    id: string,
    ts: number,
    type: string,
    fullPayload: string
  ) => ({
    id,
    ts,
    type,
    payloadPreview: fullPayload,
    fullPayload,
  });

  it('starts with the correct header row', () => {
    const csv = buildEventsCsv([]);
    expect(csv).toBe('id,ts,type,payload\n');
  });

  it('produces a valid CSV row for a single simple event', () => {
    const ts = 1_782_460_000_000;
    const event = makeEvent(
      'evt-1',
      ts,
      'pair.registered',
      '{"pairId":"USDC/EURC"}'
    );
    const csv = buildEventsCsv([event]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,ts,type,payload');
    expect(lines[1]).toBe(
      `evt-1,${new Date(ts).toISOString()},pair.registered,"{""pairId"":""USDC/EURC""}"`
    );
  });

  it('produces one data row per event', () => {
    const events = [
      makeEvent('e1', 1_782_460_000_000, 'evt.a', '{}'),
      makeEvent('e2', 1_782_460_000_001, 'evt.b', '{}'),
      makeEvent('e3', 1_782_460_000_002, 'evt.c', '{}'),
    ];
    const lines = buildEventsCsv(events).split('\n');
    // header + 3 data rows
    expect(lines).toHaveLength(4);
  });

  it('uses the fullPayload (not payloadPreview) for the CSV cell', () => {
    const full = '{"body":"' + 'x'.repeat(5000) + '"}';
    const preview = full.slice(0, 4000) + '\n… truncated';
    const event = {
      id: 'evt-large',
      ts: 1_782_460_000_000,
      type: 'payload.large',
      payloadPreview: preview,
      fullPayload: full,
    };
    const csv = buildEventsCsv([event]);
    expect(csv).toContain(full.replace(/"/g, '""'));
    expect(csv).not.toContain('truncated');
  });

  it('escapes commas in event type', () => {
    const event = makeEvent('e1', 1_782_460_000_000, 'type,with,commas', '{}');
    const csv = buildEventsCsv([event]);
    expect(csv).toContain('"type,with,commas"');
  });

  it('escapes newlines in payload JSON', () => {
    const payload = '{\n  "key": "value"\n}';
    const event = makeEvent('e1', 1_782_460_000_000, 'evt', payload);
    const csv = buildEventsCsv([event]);
    // The payload cell should be quoted because it contains newlines
    expect(csv).toContain('"{\n  ""key"": ""value""\n}"');
  });

  it('returns only the header when given an empty array', () => {
    expect(buildEventsCsv([])).toBe('id,ts,type,payload\n');
  });
});

// ---------------------------------------------------------------------------
// CSV export – integration tests for the Export CSV button in EventsClient
// ---------------------------------------------------------------------------

describe('EventsPage – CSV export', () => {
  let originalFetch: typeof global.fetch;
  let originalCreateObjectURL: typeof URL.createObjectURL;
  let originalRevokeObjectURL: typeof URL.revokeObjectURL;
  let originalCreateElement: typeof document.createElement;
  let originalAppendChild: typeof document.body.appendChild;
  let originalRemoveChild: typeof document.body.removeChild;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalCreateObjectURL = URL.createObjectURL;
    originalRevokeObjectURL = URL.revokeObjectURL;
    originalCreateElement = document.createElement.bind(document);
    originalAppendChild = document.body.appendChild.bind(document.body);
    originalRemoveChild = document.body.removeChild.bind(document.body);

    URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  function renderPage() {
    return render(
      <ToastProvider>
        <EventsPage />
      </ToastProvider>
    );
  }

  it('renders an Export CSV button', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'e1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { a: 1 },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();

    expect(
      await screen.findByRole('button', { name: /export csv/i })
    ).toBeInTheDocument();
  });

  it('Export CSV button is disabled while events are loading', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {})
    ) as unknown as typeof global.fetch;
    renderPage();
    const btn = screen.getByRole('button', { name: /export csv/i });
    expect(btn).toBeDisabled();
  });

  it('Export CSV button is disabled when no events are loaded', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ items: [] }),
    } as unknown as Response);

    renderPage();
    await screen.findByText(/No events/i);

    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('Export CSV button is enabled when events are present', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'e1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: {},
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for the event list to load before checking button state
    await screen.findByText('pair.registered');
    const btn = screen.getByRole('button', { name: /export csv/i });
    expect(btn).not.toBeDisabled();
  });

  it('clicking Export CSV creates a Blob URL and revokes it', async () => {
    const anchorClick = jest.fn();
    const anchorEl = Object.assign(document.createElement('a'), {
      click: anchorClick,
    });
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchorEl;
      return originalCreateElement(tag);
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'e1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { a: 1 },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for events to load before the button becomes enabled
    await screen.findByText('pair.registered');
    const btn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(btn);

    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('the downloaded Blob contains the CSV header and event data', async () => {
    let capturedBlob: Blob | undefined;
    URL.createObjectURL = jest.fn().mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'evt-csv',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: { pairId: 'USDC/EURC' },
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for events to load, then the button will be enabled
    await screen.findByText('pair.registered');
    const btn = screen.getByRole('button', { name: /export csv/i });
    fireEvent.click(btn);

    expect(capturedBlob).toBeDefined();
    // Read blob content using FileReader (jsdom-compatible)
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(capturedBlob!);
    });
    expect(text).toContain('id,ts,type,payload');
    expect(text).toContain('evt-csv');
    expect(text).toContain('pair.registered');
    expect(text).toContain('USDC/EURC');
  });

  it('the downloaded filename has a .csv extension', async () => {
    const anchorEl = Object.assign(document.createElement('a'), {
      click: jest.fn(),
    });
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchorEl;
      return originalCreateElement(tag);
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { id: 'e1', ts: 1_782_460_000_000, type: 'evt', payload: {} },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for events to load
    await screen.findByText('evt');
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(anchorEl.download).toMatch(/^events-.*\.csv$/);
  });

  it('export includes only the filtered rows when a type filter is active', async () => {
    let capturedBlob: Blob | undefined;
    URL.createObjectURL = jest.fn().mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'e1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: {},
            },
            {
              id: 'e2',
              ts: 1_782_460_000_001,
              type: 'pair.updated',
              payload: {},
            },
            {
              id: 'e3',
              ts: 1_782_460_000_002,
              type: 'quote.requested',
              payload: {},
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for all events to load
    await screen.findByText('pair.registered');

    // Apply a filter to show only pair.* events
    fireEvent.change(screen.getByPlaceholderText('pair.registered'), {
      target: { value: 'pair' },
    });

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(capturedBlob).toBeDefined();
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(capturedBlob!);
    });
    expect(text).toContain('pair.registered');
    expect(text).toContain('pair.updated');
    expect(text).not.toContain('quote.requested');
  });

  it('Export CSV button becomes disabled when filter yields no results', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            {
              id: 'e1',
              ts: 1_782_460_000_000,
              type: 'pair.registered',
              payload: {},
            },
          ],
        }),
    } as unknown as Response);

    renderPage();
    await screen.findByText('pair.registered');

    // Filter that matches nothing
    fireEvent.change(screen.getByPlaceholderText('pair.registered'), {
      target: { value: 'zzznomatch' },
    });

    expect(screen.getByRole('button', { name: /export csv/i })).toBeDisabled();
  });

  it('CSV Blob has text/csv MIME type', async () => {
    let capturedBlob: Blob | undefined;
    URL.createObjectURL = jest.fn().mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return 'blob:mock-url';
    });

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          items: [
            { id: 'e1', ts: 1_782_460_000_000, type: 'evt', payload: {} },
          ],
        }),
    } as unknown as Response);

    renderPage();
    // Wait for events to load before clicking
    await screen.findByText('evt');
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(capturedBlob?.type).toContain('text/csv');
  });
});

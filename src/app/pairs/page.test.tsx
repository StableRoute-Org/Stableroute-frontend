import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import PairsPage from './page';
import { filterPairs, groupBySource } from './pairsUtils';

const mockPush = jest.fn();

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));

// filterPairs/groupBySource are wrapped in jest.fn() around their real
// implementations so the memoization tests can assert how often each
// derivation runs, while the component still renders real output. The mock is
// shared with the copy that Client.tsx imports.
jest.mock('./pairsUtils', () => {
  const actual = jest.requireActual('./pairsUtils');
  return {
    ...actual,
    filterPairs: jest.fn(actual.filterPairs),
    groupBySource: jest.fn(actual.groupBySource),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(pairs: { source: string; destination: string }[]) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ pairs }),
  } as unknown as Response);
}

function mockFetchPending() {
  global.fetch = jest.fn(
    () => new Promise(() => {})
  ) as unknown as typeof global.fetch;
}

function mockFetchError(message: string) {
  global.fetch = jest.fn().mockRejectedValueOnce(new Error(message));
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

describe('PairsPage', () => {
  let originalFetch: typeof global.fetch;
  let originalClipboard: Clipboard;
  let originalSecureContext: boolean;

  beforeEach(() => {
    originalFetch = global.fetch;
    originalClipboard = navigator.clipboard;
    originalSecureContext = window.isSecureContext;
    mockPush.mockClear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: originalSecureContext,
    });
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  it('shows loading before data arrives', () => {
    mockFetchPending();
    render(<PairsPage />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(document.querySelector('[aria-live=polite]')).toHaveAttribute(
      'aria-busy',
      'true'
    );
  });

  it('shows count badge with total pairs', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: 'USDC', destination: 'EURC' },
            { source: 'USDC', destination: 'NGNC' },
            { source: 'BTC', destination: 'USDC' },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('3 pairs')).toBeInTheDocument();
    });
  });

  it('renders pairs in a single polite live region', async () => {
    mockFetch([{ source: 'USDC', destination: 'EURC' }]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('1 pair')).toBeInTheDocument();
    });
    expect(document.querySelectorAll('[aria-live=polite]')).toHaveLength(1);
  });

  it("uses singular 'pair' when count is 1", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: 'USDC', destination: 'EURC' }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('1 pair')).toBeInTheDocument();
    });
  });

  it('groups pairs by source with sorted headings and destinations', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: 'USDC', destination: 'EURC' },
            { source: 'BTC', destination: 'USDC' },
            { source: 'USDC', destination: 'NGNC' },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('3 pairs')).toBeInTheDocument();
    });

    // Source headings should be sorted alphabetically (BTC before USDC)
    const headings = document.querySelectorAll('h2');
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent('BTC');
    expect(headings[1]).toHaveTextContent('USDC');

    // BTC section has one destination: "USDC"
    const btcSection = headings[0].closest('section')!;
    const btcDests = btcSection.querySelectorAll('li span.font-mono');
    expect(btcDests).toHaveLength(1);
    expect(btcDests[0]).toHaveTextContent('USDC');

    // USDC destinations should be sorted: EURC, NGNC
    const usdcSection = headings[1].closest('section')!;
    const usdcDests = usdcSection.querySelectorAll('li span.font-mono');
    expect(usdcDests).toHaveLength(2);
    expect(usdcDests[0]).toHaveTextContent('EURC');
    expect(usdcDests[1]).toHaveTextContent('NGNC');

    // Quote and Delete buttons present
    expect(screen.getAllByText('Quote')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });

  it('shows single source with multiple destinations without repeating the source', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          pairs: [
            { source: 'USDC', destination: 'EURC' },
            { source: 'USDC', destination: 'NGNC' },
            { source: 'USDC', destination: 'BRL' },
          ],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('3 pairs')).toBeInTheDocument();
    });

    // Only one source heading
    const headings = document.querySelectorAll('h2');
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('USDC');

    // Three destinations listed
    const destItems = document.querySelectorAll('li span.font-mono');
    expect(destItems).toHaveLength(3);

    // Source "USDC" appears only as heading, not within destination items
    const destTexts = Array.from(destItems).map((el) => el.textContent);
    destTexts.forEach((text) => {
      expect(text).not.toContain('→');
    });
  });

  it("announces empty state 'No pairs registered yet' when zero pairs", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ pairs: [] }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
    expect(document.querySelector('[aria-live=polite]')).toHaveAttribute(
      'aria-busy',
      'false'
    );
  });

  it("shows 'No pairs found' when filter matches nothing with existing pairs", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: 'USDC', destination: 'EURC' }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('1 pair')).toBeInTheDocument();
    });

    // Type a filter that matches nothing
    const input = screen.getByPlaceholderText('Search by asset code');
    fireEvent.change(input, { target: { value: 'ZZZ' } });

    await waitFor(() => {
      expect(screen.getByText('No pairs found')).toBeInTheDocument();
    });
  });

  it('surfaces errors with role=alert', async () => {
    mockFetchError('Network error');
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Network/i);
    });
    expect(document.querySelector('[aria-live=polite]')).toHaveAttribute(
      'aria-busy',
      'false'
    );
  });

  it('has exactly one aria-live=polite region', async () => {
    mockFetch([]);
    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText(/No pairs registered yet/i)).toBeInTheDocument();
    });
    expect(document.querySelectorAll('[aria-live=polite]')).toHaveLength(1);
  });

  it('does not show count badge while loading', () => {
    global.fetch = jest.fn(
      () => new Promise(() => {})
    ) as unknown as typeof global.fetch;
    render(<PairsPage />);

    // During loading, badge text like "3 pairs" or "1 pair" must not be present.
    // Use a regex anchored to a digit followed by space and "pair".
    expect(screen.queryByText(/\d+ pairs?/)).not.toBeInTheDocument();
  });

  it('preserves quote and delete links with correct URLs in grouped view', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          pairs: [{ source: 'USDC', destination: 'EURC' }],
        }),
    } as unknown as Response);

    render(<PairsPage />);
    await waitFor(() => {
      expect(screen.getByText('EURC')).toBeInTheDocument();
    });

    const quoteLink = screen.getByText('Quote').closest('a')!;
    expect(quoteLink).toHaveAttribute('href', '/quote?source=USDC&dest=EURC');
  });

  describe('copy pair symbol', () => {
    function enableClipboard(writeText: jest.Mock) {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
    }

    it('copies the canonical pair symbol and confirms it', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      enableClipboard(writeText);
      mockFetch([{ source: 'USDC', destination: 'EURC' }]);

      render(<PairsPage />);
      const copyButton = await screen.findByRole('button', {
        name: 'Copy pair symbol USDC/EURC',
      });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('USDC/EURC');
        expect(mockPush).toHaveBeenCalledWith('Copied USDC/EURC.');
      });
      expect(
        screen.queryByRole('textbox', { name: 'Pair symbol USDC/EURC' })
      ).not.toBeInTheDocument();
    });

    it('shows a selectable fallback when clipboard writing fails', async () => {
      enableClipboard(jest.fn().mockRejectedValue(new Error('denied')));
      mockFetch([{ source: 'USDC', destination: 'EURC' }]);

      render(<PairsPage />);
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'Copy pair symbol USDC/EURC',
        })
      );

      const fallback = await screen.findByRole('textbox', {
        name: 'Pair symbol USDC/EURC',
      });
      const select = jest.spyOn(fallback, 'select');
      fireEvent.focus(fallback);

      expect(fallback).toHaveValue('USDC/EURC');
      expect(fallback).toHaveAttribute('readonly');
      expect(select).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        "Couldn't copy USDC/EURC automatically. Select it below to copy it.",
        'error'
      );
    });

    it('uses the fallback without attempting a write when clipboard is unavailable', async () => {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: false,
      });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: undefined,
      });
      mockFetch([{ source: 'USDC', destination: 'EURC' }]);

      render(<PairsPage />);
      fireEvent.click(
        await screen.findByRole('button', {
          name: 'Copy pair symbol USDC/EURC',
        })
      );

      expect(
        await screen.findByRole('textbox', {
          name: 'Pair symbol USDC/EURC',
        })
      ).toHaveValue('USDC/EURC');
    });

    it('blocks rapid repeated clicks while a copy is pending', async () => {
      let resolveWrite!: () => void;
      const writeText = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveWrite = resolve;
          })
      );
      enableClipboard(writeText);
      mockFetch([{ source: 'USDC', destination: 'EURC' }]);

      render(<PairsPage />);
      const copyButton = await screen.findByRole('button', {
        name: 'Copy pair symbol USDC/EURC',
      });
      fireEvent.click(copyButton);
      fireEvent.click(copyButton);

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(copyButton).toBeDisabled();

      resolveWrite();
      await waitFor(() => expect(copyButton).not.toBeDisabled());
    });
  });

  // -------------------------------------------------------------------------
  // Memoized filtering / grouping (issue: avoid recomputing on every render)
  // -------------------------------------------------------------------------

  describe('memoized filtering and grouping', () => {
    // filterPairs/groupBySource are jest.fn() wrappers (see the jest.mock
    // factory above) around the real implementations, shared with whatever
    // Client.tsx imports. mockClear (not mockReset) resets call counts
    // between tests without discarding the wrapped real implementation.
    const filterSpy = filterPairs as jest.Mock;
    const groupSpy = groupBySource as jest.Mock;

    beforeEach(() => {
      filterSpy.mockClear();
      groupSpy.mockClear();
    });

    it('does not refilter or regroup when opening/cancelling the delete dialog', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            pairs: [
              { source: 'USDC', destination: 'EURC' },
              { source: 'BTC', destination: 'USDC' },
            ],
          }),
      } as unknown as Response);

      render(<PairsPage />);
      await waitFor(() => {
        expect(screen.getByText('2 pairs')).toBeInTheDocument();
      });

      const filterCallsAfterLoad = filterSpy.mock.calls.length;
      const groupCallsAfterLoad = groupSpy.mock.calls.length;

      // Opening the delete dialog changes `pendingDelete`, an unrelated
      // piece of state — it must not trigger a refilter/regroup.
      fireEvent.click(screen.getAllByText('Delete')[0]);
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();

      expect(filterSpy.mock.calls.length).toBe(filterCallsAfterLoad);
      expect(groupSpy.mock.calls.length).toBe(groupCallsAfterLoad);

      // Cancelling closes the dialog — another unrelated re-render.
      const cancelButton = Array.from(dialog!.querySelectorAll('button')).find(
        (btn) => btn.textContent === 'Cancel'
      )!;
      fireEvent.click(cancelButton);
      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).toBeNull();
      });

      expect(filterSpy.mock.calls.length).toBe(filterCallsAfterLoad);
      expect(groupSpy.mock.calls.length).toBe(groupCallsAfterLoad);
    });

    it('does refilter and regroup when the query changes', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            pairs: [
              { source: 'USDC', destination: 'EURC' },
              { source: 'BTC', destination: 'USDC' },
            ],
          }),
      } as unknown as Response);

      render(<PairsPage />);
      await waitFor(() => {
        expect(screen.getByText('2 pairs')).toBeInTheDocument();
      });

      const filterCallsAfterLoad = filterSpy.mock.calls.length;
      const groupCallsAfterLoad = groupSpy.mock.calls.length;

      const input = screen.getByPlaceholderText('Search by asset code');
      fireEvent.change(input, { target: { value: 'BTC' } });

      await waitFor(() => {
        expect(screen.queryByText('EURC')).not.toBeInTheDocument();
      });

      expect(filterSpy.mock.calls.length).toBeGreaterThan(filterCallsAfterLoad);
      expect(groupSpy.mock.calls.length).toBeGreaterThan(groupCallsAfterLoad);
    });
  });

  // -------------------------------------------------------------------------
  // Delete flow (regression coverage for the previously-undefined `api`
  // reference, which threw on every render before this component ever
  // reached the confirm/cancel/refetch logic below)
  // -------------------------------------------------------------------------

  describe('delete flow', () => {
    it('does not call the API when the delete confirmation is cancelled', async () => {
      mockFetch([{ source: 'USDC', destination: 'EURC' }]);
      render(<PairsPage />);
      await waitFor(() => {
        expect(screen.getByText('1 pair')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));
      const dialog = await screen.findByRole('dialog');

      const fetchCallsBeforeCancel = (global.fetch as jest.Mock).mock.calls
        .length;
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect((global.fetch as jest.Mock).mock.calls.length).toBe(
        fetchCallsBeforeCancel
      );
      expect(screen.getByText('EURC')).toBeInTheDocument();
    });

    it('calls apiDelete and refetches after confirming', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              pairs: [{ source: 'USDC', destination: 'EURC' }],
            }),
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
          text: async () => '',
        } as unknown as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ pairs: [] }),
        } as unknown as Response);

      render(<PairsPage />);
      await waitFor(() => {
        expect(screen.getByText('1 pair')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));
      const dialog = await screen.findByRole('dialog');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

      await waitFor(() => {
        expect(screen.getByText('No pairs registered yet')).toBeInTheDocument();
      });

      const calls = (global.fetch as jest.Mock).mock.calls;
      expect(calls).toHaveLength(3);
      expect(String(calls[1][1]?.method)).toBe('DELETE');
      expect(String(calls[1][0])).toContain('/api/v1/pairs/USDC/EURC');
    });
  });
});

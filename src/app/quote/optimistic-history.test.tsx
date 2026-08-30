import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import QuotePage from './page';
import { HISTORY_KEY } from './historyModel';

const getSourceInput = () =>
  screen.getByRole('textbox', { name: /Source asset/i });
const getDestinationInput = () =>
  screen.getByRole('textbox', { name: /Destination asset/i });
const getAmountInput = () =>
  screen.getByRole('textbox', { name: /Amount \(base units\)/i });

const getRecentQuotesList = () => {
  const heading = screen.getByRole('heading', { name: /Recent quotes/i });
  return withinList(heading);
};

// The list lives in the section labelled by the "Recent quotes" heading.
function withinList(heading: HTMLElement): HTMLUListElement {
  const section = heading.closest('section');
  if (!section) throw new Error('Recent quotes section not found');
  return section.querySelector('ul') as HTMLUListElement;
}

const getHistoryButtons = (): HTMLButtonElement[] =>
  Array.from(getRecentQuotesList().querySelectorAll('button'));

const getPendingRow = (): HTMLElement | null =>
  getRecentQuotesList().querySelector('[data-pending]');

const quoteResponse = (
  body: Record<string, unknown>
): Response => ({ ok: true, text: async () => JSON.stringify(body) } as unknown as Response);

async function fillAndSubmit(
  source: string,
  dest: string,
  amount: string
): Promise<void> {
  fireEvent.change(getSourceInput(), { target: { value: source } });
  fireEvent.change(getDestinationInput(), { target: { value: dest } });
  fireEvent.change(getAmountInput(), { target: { value: amount } });
  fireEvent.submit(getAmountInput().closest('form')!);
}

describe('QuotePage optimistic recent quotes (#723)', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('shows the optimistic row immediately and replaces it with the server-canonical entry on success', async () => {
    // Server canonicalises the destination to lowercase — distinct from the
    // typed form value, so the swap proves reconciliation uses response fields.
    globalThis.fetch = jest
      .fn()
      .mockResolvedValue(
        quoteResponse({
          source_asset: 'USDC',
          dest_asset: 'eurc',
          amount: '1000000',
          estimated_rate: '1.02',
          route: ['USDC', 'eurc'],
        })
      ) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    // Optimistic row is visible before the response arrives...
    expect(getPendingRow()).not.toBeNull();
    expect(getHistoryButtons()[0].textContent).toContain('USDC → EURC');
    // ...and nothing has been persisted yet.
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();

    await waitFor(() => {
      expect(getPendingRow()).toBeNull();
    });
    // Confirmed entry is built from the SERVER fields ('eurc'), not the
    // locally typed ones, and is now persisted.
    expect(getHistoryButtons()[0].textContent).toContain('USDC → eurc');
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    expect(stored[0]).toMatchObject({ source: 'USDC', dest: 'eurc' });
    expect(stored).toHaveLength(1);
  });

  it('rolls back exactly to the prior state on error and leaves storage untouched', async () => {
    const seeded = [
      { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 123 },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seeded));
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    expect(getHistoryButtons()).toHaveLength(1);

    await fillAndSubmit('USDC', 'EURC', '1000000');
    expect(getPendingRow()).not.toBeNull();

    await waitFor(() => {
      expect(getPendingRow()).toBeNull();
    });

    // Exact rollback: only the pre-existing row remains.
    const rows = getHistoryButtons();
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('XLM → USDC · 500');
    // Storage was never touched by the optimistic mutation.
    expect(localStorage.getItem(HISTORY_KEY)).toBe(
      JSON.stringify(seeded)
    );
  });

  it('ignores stale responses when a newer submission supersedes an older one', async () => {
    jest.useFakeTimers();

    let resolveA: ((value: Response) => void) | undefined;
    let resolveB: ((value: Response) => void) | undefined;
    const pendingA = new Promise<Response>((resolve) => {
      resolveA = resolve;
    });
    const pendingB = new Promise<Response>((resolve) => {
      resolveB = resolve;
    });
    globalThis.fetch = jest
      .fn()
      .mockImplementationOnce(() => pendingA)
      .mockImplementationOnce(() => pendingB) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);

    await act(async () => {
      await fillAndSubmit('USDC', 'EURC', '1000000');
    });

    // Cooldown window passes; user edits the pair and submits again while
    // request A is still unresolved.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => {
      await fillAndSubmit('XLM', 'BTC', '777');
    });

    // Only B's optimistic row shows; A was implicitly discarded.
    expect(getPendingRow()).not.toBeNull();
    expect(getHistoryButtons()).toHaveLength(1);
    expect(getHistoryButtons()[0].textContent).toContain('XLM → BTC · 777');

    // A resolves LATE — its result must not touch the newer state.
    await act(async () => {
      resolveA?.(
        quoteResponse({
          source_asset: 'USDC',
          dest_asset: 'EURC',
          amount: '1000000',
          estimated_rate: '1.0',
          route: ['USDC', 'EURC'],
        })
      );
    });
    expect(getPendingRow()).not.toBeNull();
    expect(getHistoryButtons()).toHaveLength(1);
    expect(getHistoryButtons()[0].textContent).toContain('XLM → BTC · 777');
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();

    // B settles: its optimistic row reconciles into the single stored entry.
    await act(async () => {
      resolveB?.(
        quoteResponse({
          source_asset: 'XLM',
          dest_asset: 'BTC',
          amount: '777',
          estimated_rate: '1.1',
          route: ['XLM', 'BTC'],
        })
      );
    });
    expect(getPendingRow()).toBeNull();
    expect(getHistoryButtons()[0].textContent).toContain('XLM → BTC · 777');
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ source: 'XLM', dest: 'BTC' });
  });

  it('leaves concurrent unrelated updates unaffected by a rollback', async () => {
    const seeded = [
      { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 123 },
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(seeded));
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');
    expect(getPendingRow()).not.toBeNull();

    // Unrelated update mid-flight: pick the existing row back into the form.
    fireEvent.click(getHistoryButtons()[getHistoryButtons().length - 1]);
    expect(getSourceInput()).toHaveValue('XLM');
    expect(getDestinationInput()).toHaveValue('USDC');
    expect(getAmountInput()).toHaveValue('500');

    // Request fails and rolls back the optimistic row…
    await waitFor(() => {
      expect(getPendingRow()).toBeNull();
    });
    // …but the unrelated form edits survive untouched.
    expect(getSourceInput()).toHaveValue('XLM');
    expect(getDestinationInput()).toHaveValue('USDC');
    expect(getAmountInput()).toHaveValue('500');
    expect(getHistoryButtons()).toHaveLength(1);
    expect(localStorage.getItem(HISTORY_KEY)).toBe(JSON.stringify(seeded));
  });

  it('announces the rollback to assistive technology', async () => {
    globalThis.fetch = jest
      .fn()
      .mockRejectedValue(new Error('network down')) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    await waitFor(() => {
      const liveRegion = document.querySelector(
        'form p[aria-live="polite"]'
      );
      expect(liveRegion?.textContent).toMatch(/rolled back/i);
    });
  });
});

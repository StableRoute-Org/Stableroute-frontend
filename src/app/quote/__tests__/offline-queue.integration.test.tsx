import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import QuotePage from '../page';
import { OFFLINE_QUEUE_KEY, QueuedSwapMutation } from '../offlineQueueModel';

const getSourceInput = () =>
  screen.getByLabelText(/Source asset/i, { selector: 'input' });
const getDestinationInput = () =>
  screen.getByLabelText(/Destination asset/i, { selector: 'input' });
const getAmountInput = () =>
  screen.getByRole('textbox', { name: /Amount \(base units\)/i });

async function fillAndSubmit(
  source: string,
  dest: string,
  amount: string
): Promise<void> {
  fireEvent.change(getSourceInput(), { target: { value: source } });
  fireEvent.change(getDestinationInput(), { target: { value: dest } });
  fireEvent.change(getAmountInput(), { target: { value: amount } });
  fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));
}

describe('Offline Detection, Queue & Reconcile Integration Tests (#729)', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  it('edge case 1: go offline -> mutation queued, UI reflects offline', async () => {
    globalThis.fetch = jest.fn();
    render(<QuotePage />);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Verify UI reflects offline
    expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

    // Submit mutation while offline
    await act(async () => {
      await fillAndSubmit('USDC', 'EURC', '1000000');
    });

    // Fetch must NOT be called when offline
    expect(globalThis.fetch).not.toHaveBeenCalled();

    // UI reflects queued mutation
    expect(screen.getByTestId('offline-queue-section')).toBeInTheDocument();
    expect(screen.getByText(/USDC → EURC · 1000000/)).toBeInTheDocument();

    // Queue is persisted to localStorage
    const rawQueue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    expect(rawQueue).toBeTruthy();
    const parsed = JSON.parse(rawQueue!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].source).toBe('USDC');
    expect(parsed[0].dest).toBe('EURC');
    expect(parsed[0].amount).toBe('1000000');
    expect(parsed[0].status).toBe('queued');
  });

  it('edge case 2: reconnect -> queue flushes in order', async () => {
    const fetchCalls: string[] = [];
    globalThis.fetch = jest.fn().mockImplementation(async (url: string) => {
      fetchCalls.push(url);
      const urlObj = new URL(url, 'http://localhost');
      const source = urlObj.searchParams.get('source_asset');
      const dest = urlObj.searchParams.get('dest_asset');
      const amount = urlObj.searchParams.get('amount');

      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            source_asset: source,
            dest_asset: dest,
            amount: amount,
            estimated_rate: '1.05',
            route: [source, dest],
          }),
      } as unknown as Response;
    });

    render(<QuotePage />);

    // Go offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    // Submit two mutations in order (FIFO)
    await act(async () => {
      await fillAndSubmit('USDC', 'EURC', '1000000');
    });
    await act(async () => {
      await fillAndSubmit('XLM', 'USDC', '500000');
    });

    expect(screen.getByText(/Offline Queued Mutations \(2\)/)).toBeInTheDocument();
    expect(globalThis.fetch).not.toHaveBeenCalled();

    // Reconnect to network
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Wait for auto-flush and reconcile
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    // Verify FIFO execution order: first USDC -> EURC, then XLM -> USDC
    expect(fetchCalls[0]).toContain('source_asset=USDC&dest_asset=EURC&amount=1000000');
    expect(fetchCalls[1]).toContain('source_asset=XLM&dest_asset=USDC&amount=500000');

    // Queue should be purged after successful reconcile
    await waitFor(() => {
      expect(screen.queryByTestId('offline-queue-section')).not.toBeInTheDocument();
    });

    // Verify recent quotes table contains reconciled rows
    const table = screen.getByRole('table');
    expect(table).toHaveTextContent(/USDC/);
    expect(table).toHaveTextContent(/XLM/);
  });

  it('edge case 3: reload while offline -> queue persists', () => {
    // Seed localStorage with queued mutations from a previous session
    const preExisting: QueuedSwapMutation[] = [
      {
        id: 'persisted-1',
        source: 'USDC',
        dest: 'EURC',
        amount: '2500000',
        timestamp: 1600000000000,
        status: 'queued',
      },
      {
        id: 'persisted-2',
        source: 'BTC',
        dest: 'ETH',
        amount: '50000',
        timestamp: 1600000001000,
        status: 'queued',
      },
    ];
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(preExisting));

    // Mount page (simulating page reload while offline)
    render(<QuotePage />);

    // Queue section is loaded immediately from localStorage
    expect(screen.getByTestId('offline-queue-section')).toBeInTheDocument();
    expect(screen.getByText(/Offline Queued Mutations \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/USDC → EURC · 2500000/)).toBeInTheDocument();
    expect(screen.getByText(/BTC → ETH · 50000/)).toBeInTheDocument();
  });

  it('edge case 4: flush twice -> no double-apply', async () => {
    let callCount = 0;
    globalThis.fetch = jest.fn().mockImplementation(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        ok: true,
        text: async () =>
          JSON.stringify({
            source_asset: 'USDC',
            dest_asset: 'EURC',
            amount: '1000000',
            estimated_rate: '1.0',
            route: ['USDC', 'EURC'],
          }),
      } as unknown as Response;
    });

    render(<QuotePage />);

    // Go offline and queue a mutation
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await act(async () => {
      await fillAndSubmit('USDC', 'EURC', '1000000');
    });

    // Trigger online event twice rapidly (double reconnect)
    act(() => {
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(callCount).toBe(1);
    });

    // Ensure it never exceeded 1 call even after all promises settle
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(callCount).toBe(1);
  });

  it('edge case 5: server conflict -> surfaced', async () => {
    // Server rejects quote due to slippage / conflict
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: 'conflict',
          message: 'Route liquidity depleted: slippage exceeds maximum allowed',
        }),
    } as unknown as Response);

    render(<QuotePage />);

    // Go offline & submit mutation
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await act(async () => {
      await fillAndSubmit('USDC', 'EURC', '5000000');
    });

    // Reconnect
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Verify conflict alert is surfaced to user
    await waitFor(() => {
      expect(screen.getByTestId('conflict-alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Route liquidity depleted: slippage exceeds maximum allowed/i)).toBeInTheDocument();

    // Verify mutation row in queued section displays conflict badge
    const queuedSection = screen.getByTestId('offline-queue-section');
    expect(queuedSection).toHaveTextContent(/conflict/);

    // Dismiss conflict
    fireEvent.click(screen.getByRole('button', { name: /Dismiss conflict/i }));

    // Verify conflict alert is dismissed
    await waitFor(() => {
      expect(screen.queryByTestId('conflict-alert')).not.toBeInTheDocument();
    });
  });
});

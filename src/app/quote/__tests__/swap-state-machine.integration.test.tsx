import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuotePage from '../page';

const getSourceInput = () =>
  screen.getByRole('textbox', { name: /Source asset/i });
const getDestinationInput = () =>
  screen.getByRole('textbox', { name: /Destination asset/i });
const getAmountInput = () =>
  screen.getByRole('textbox', { name: /Amount \(base units\)/i });

const quoteResponse = (body: Record<string, unknown>, ok = true, status = 200): Response =>
  ({
    ok,
    status,
    statusText: ok ? 'OK' : 'Bad Request',
    headers: new Headers({ 'x-request-id': 'req-test-123' }),
    text: async () => JSON.stringify(body),
  } as unknown as Response);

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

describe('Swap Async State Machine Integration (#725)', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('renders initial empty state with no loader, error, or success quote details', () => {
    render(<QuotePage />);

    expect(screen.getByTestId('swap-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();
    expect(screen.getByText(/No quote requested yet/i)).toBeInTheDocument();
  });

  it('transitions to loading during quote request showing loader only', async () => {
    let resolvePromise: (res: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });
    globalThis.fetch = jest.fn().mockReturnValue(fetchPromise) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    expect(screen.getByTestId('swap-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();
    expect(screen.getByText(/Finding optimal route/i)).toBeInTheDocument();

    // Clean up pending promise
    resolvePromise!(
      quoteResponse({
        source_asset: 'USDC',
        dest_asset: 'EURC',
        amount: '1000000',
        estimated_rate: '1.05',
        route: ['USDC', 'EURC'],
      })
    );
  });

  it('transitions to success displaying quote and slippage with mutually exclusive views', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      quoteResponse({
        source_asset: 'USDC',
        dest_asset: 'EURC',
        amount: '1000000',
        estimated_rate: '1.05',
        route: ['USDC', 'EURC'],
      })
    ) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    await waitFor(() => {
      expect(screen.getByTestId('swap-success')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();

    expect(screen.getByText('USDC → EURC')).toBeInTheDocument();
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('Slippage: 5.00%');
  });

  it('transitions to error showing error alert, request id, and retry button', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      quoteResponse({ error: 'No liquidity route found' }, false, 400)
    ) as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    await waitFor(() => {
      expect(screen.getByTestId('swap-error')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('swap-loading')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-empty')).not.toBeInTheDocument();
    expect(screen.queryByTestId('swap-success')).not.toBeInTheDocument();

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retry quote/i })).toBeInTheDocument();
  });

  it('successfully retries from error state and transitions back to loading then success', async () => {
    // 1st fetch fails
    const mockFetch = jest
      .fn()
      .mockResolvedValueOnce(
        quoteResponse({ error: 'Temporary routing glitch' }, false, 500)
      )
      // 2nd fetch succeeds
      .mockResolvedValueOnce(
        quoteResponse({
          source_asset: 'USDC',
          dest_asset: 'EURC',
          amount: '1000000',
          estimated_rate: '1.02',
          route: ['USDC', 'EURC'],
        })
      );
    globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

    render(<QuotePage />);
    await fillAndSubmit('USDC', 'EURC', '1000000');

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId('swap-error')).toBeInTheDocument();
    });

    // Click retry
    const retryBtn = screen.getByRole('button', { name: /Retry quote/i });
    fireEvent.click(retryBtn);

    // Should resolve to success
    await waitFor(() => {
      expect(screen.getByTestId('swap-success')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('swap-error')).not.toBeInTheDocument();
    expect(screen.getByText('USDC → EURC')).toBeInTheDocument();
    expect(screen.getByTestId('slippage-status')).toHaveTextContent('Slippage: 2.00%');
  });
});

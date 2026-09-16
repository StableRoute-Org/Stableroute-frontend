import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDebouncedSwapSearch } from './useDebouncedSwapSearch';
import { SwapSearchBar } from './SwapSearchBar';
import { SearchExecutionError } from './searchQuotes';
import type { HistoryEntry } from './tableModel';

const sampleEntries: HistoryEntry[] = [
  { source: 'USDC', dest: 'EURC', amount: '1000', savedAt: 1000 },
  { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 2000 },
  { source: 'BTC', dest: 'ETH', amount: '250', savedAt: 3000 },
];

function TestSwapSearchComponent({
  initialEntries = sampleEntries,
  debounceMs = 250,
  searchFn,
}: {
  initialEntries?: HistoryEntry[];
  debounceMs?: number;
  searchFn?: any;
}) {
  const search = useDebouncedSwapSearch({
    entries: initialEntries,
    debounceMs,
    searchFn,
  });

  return (
    <div>
      <SwapSearchBar
        query={search.query}
        onQueryChange={search.setQuery}
        onClear={search.clearQuery}
        isLoading={search.isLoading}
        isError={search.isError}
        errorMessage={search.error?.message}
        onRetry={search.retry}
        resultsCount={search.results.length}
      />
      {search.isEmpty && (
        <div data-testid="empty-search-state">No matching quotes found</div>
      )}
      <ul data-testid="search-results-list">
        {search.results.map((item) => (
          <li
            key={`${item.source}-${item.dest}-${item.amount}-${item.savedAt}`}
            data-testid="quote-row"
          >
            {item.source} → {item.dest} · {item.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe('Swap Search Integration (Issue #728 Edge Cases)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('edge case 1: typing quickly -> one query after the pause', async () => {
    const mockSearch = jest
      .fn()
      .mockImplementation(async (_entries, q, opts) => ({
        items: sampleEntries.filter((e) => e.source.toLowerCase().includes(q)),
        total: 1,
        query: q,
        token: opts?.token ?? 0,
      }));

    render(
      <TestSwapSearchComponent
        initialEntries={sampleEntries}
        debounceMs={250}
        searchFn={mockSearch}
      />
    );

    const input = screen.getByLabelText('Filter quotes');

    // Rapid typing simulation
    fireEvent.change(input, { target: { value: 'u' } });
    act(() => {
      jest.advanceTimersByTime(60);
    });

    fireEvent.change(input, { target: { value: 'us' } });
    act(() => {
      jest.advanceTimersByTime(60);
    });

    fireEvent.change(input, { target: { value: 'usd' } });
    act(() => {
      jest.advanceTimersByTime(60);
    });

    fireEvent.change(input, { target: { value: 'usdc' } });

    // No search query dispatched before the pause
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance past the 250ms pause
    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    // Exactly one query dispatched with the full debounced query
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'usdc',
      expect.objectContaining({ token: 1 })
    );

    const rows = screen.getAllByTestId('quote-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('USDC → EURC · 1000');
  });

  it('edge case 2: fast then slow response -> newest result wins', async () => {
    let resolveFirst: ((val: any) => void) | null = null;
    let resolveSecond: ((val: any) => void) | null = null;

    const mockSearch = jest.fn().mockImplementation((_entries, q, opts) => {
      if (q === 'slow-query') {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      if (q === 'fast-query') {
        return new Promise((resolve) => {
          resolveSecond = resolve;
        });
      }
      return Promise.resolve({
        items: [],
        total: 0,
        query: q,
        token: opts?.token ?? 0,
      });
    });

    render(
      <TestSwapSearchComponent
        initialEntries={sampleEntries}
        debounceMs={100}
        searchFn={mockSearch}
      />
    );

    const input = screen.getByLabelText('Filter quotes');

    // First: slow query
    fireEvent.change(input, { target: { value: 'slow-query' } });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'slow-query',
      expect.objectContaining({ token: 1 })
    );

    // Second: fast query
    fireEvent.change(input, { target: { value: 'fast-query' } });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'fast-query',
      expect.objectContaining({ token: 2 })
    );

    // Fast query (token 2) finishes first
    await act(async () => {
      resolveSecond!({
        items: [sampleEntries[1]], // XLM
        total: 1,
        query: 'fast-query',
        token: 2,
      });
    });

    expect(screen.getAllByTestId('quote-row')).toHaveLength(1);
    expect(screen.getByTestId('quote-row')).toHaveTextContent(
      'XLM → USDC · 500'
    );

    // Slower query (token 1) finishes later
    await act(async () => {
      resolveFirst!({
        items: [sampleEntries[0]], // USDC
        total: 1,
        query: 'slow-query',
        token: 1,
      });
    });

    // Stale slow query response is dropped; fast (newest) result remains in DOM!
    expect(screen.getAllByTestId('quote-row')).toHaveLength(1);
    expect(screen.getByTestId('quote-row')).toHaveTextContent(
      'XLM → USDC · 500'
    );
  });

  it('edge case 3: no matches -> empty state', async () => {
    const mockSearch = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      query: 'unknown-token',
      token: 1,
    });

    render(
      <TestSwapSearchComponent
        initialEntries={sampleEntries}
        debounceMs={100}
        searchFn={mockSearch}
      />
    );

    const input = screen.getByLabelText('Filter quotes');
    fireEvent.change(input, { target: { value: 'unknown-token' } });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getByTestId('empty-search-state')).toHaveTextContent(
      'No matching quotes found'
    );
    expect(screen.queryAllByTestId('quote-row')).toHaveLength(0);
    expect(
      screen.getByText('No quotes match "unknown-token".')
    ).toBeInTheDocument();
  });

  it('edge case 4: cleared input -> resets results', async () => {
    const mockSearch = jest.fn().mockResolvedValue({
      items: [sampleEntries[0]],
      total: 1,
      query: 'usdc',
      token: 1,
    });

    render(
      <TestSwapSearchComponent
        initialEntries={sampleEntries}
        debounceMs={100}
        searchFn={mockSearch}
      />
    );

    const input = screen.getByLabelText('Filter quotes');
    fireEvent.change(input, { target: { value: 'usdc' } });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(screen.getAllByTestId('quote-row')).toHaveLength(1);

    // Clear via clear button
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    act(() => {
      fireEvent.click(clearButton);
    });

    // Immediately resets results without waiting for debounce
    expect(screen.getAllByTestId('quote-row')).toHaveLength(3);
    expect(input).toHaveValue('');
  });

  it('edge case 5: error -> error state with retry', async () => {
    let failAttempt = true;
    const mockSearch = jest.fn().mockImplementation((_entries, q, opts) => {
      if (failAttempt) {
        return Promise.reject(
          new SearchExecutionError(
            'Failed to search quotes. Check your connection.',
            'SEARCH_NETWORK_ERROR'
          )
        );
      }
      return Promise.resolve({
        items: [sampleEntries[2]], // BTC
        total: 1,
        query: q,
        token: opts?.token ?? 0,
      });
    });

    render(
      <TestSwapSearchComponent
        initialEntries={sampleEntries}
        debounceMs={100}
        searchFn={mockSearch}
      />
    );

    const input = screen.getByLabelText('Filter quotes');
    fireEvent.change(input, { target: { value: 'btc' } });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Error alert is rendered
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(
      'Failed to search quotes. Check your connection.'
    );
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryAllByTestId('quote-row')).toHaveLength(0);

    // Click retry
    failAttempt = false;
    const retryBtn = screen.getByRole('button', { name: 'Retry' });
    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Error cleared, results populated
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    const rows = screen.getAllByTestId('quote-row');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('BTC → ETH · 250');
  });
});

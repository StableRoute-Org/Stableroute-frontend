import { act, renderHook } from '@testing-library/react';
import {
  useDebouncedSwapSearch,
  type SearchStatus,
} from './useDebouncedSwapSearch';
import { SearchExecutionError, type SearchOptions } from './searchQuotes';
import type { HistoryEntry } from './tableModel';

describe('useDebouncedSwapSearch', () => {
  const sampleEntries: HistoryEntry[] = [
    { source: 'USDC', dest: 'EURC', amount: '1000', savedAt: 1000 },
    { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 2000 },
    { source: 'BTC', dest: 'ETH', amount: '250', savedAt: 3000 },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('edge case 1: typing quickly -> one query after the pause', async () => {
    const mockSearch = jest.fn().mockImplementation(async (_e, q, opts) => ({
      items: sampleEntries.filter((s) => s.source.toLowerCase().includes(q)),
      total: 1,
      query: q,
      token: opts?.token ?? 0,
    }));

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 200,
        searchFn: mockSearch,
      })
    );

    expect(result.current.status).toBe('idle');
    expect(mockSearch).not.toHaveBeenCalled();

    // Type rapidly: 'u', 'us', 'usd', 'usdc'
    act(() => {
      result.current.setQuery('u');
    });
    act(() => {
      jest.advanceTimersByTime(50);
      result.current.setQuery('us');
    });
    act(() => {
      jest.advanceTimersByTime(50);
      result.current.setQuery('usd');
    });
    act(() => {
      jest.advanceTimersByTime(50);
      result.current.setQuery('usdc');
    });

    // Still within debounce window, no query dispatched yet
    expect(mockSearch).not.toHaveBeenCalled();

    // Advance past debounce pause (200ms)
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // Exactly one search should have been executed with final query
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'usdc',
      expect.objectContaining({ token: 1 })
    );
    expect(result.current.status).toBe('success');
  });

  it('edge case 2: fast then slow response -> newest result wins', async () => {
    let resolveFirst: ((val: any) => void) | null = null;
    let resolveSecond: ((val: any) => void) | null = null;

    const mockSearch = jest.fn().mockImplementation((_e, q, opts) => {
      if (q === 'first-slow') {
        return new Promise((resolve) => {
          resolveFirst = resolve;
        });
      }
      if (q === 'second-fast') {
        return new Promise((resolve) => {
          resolveSecond = resolve;
        });
      }
      return Promise.resolve({
        items: [],
        total: 0,
        query: q,
        token: opts.token,
      });
    });

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 100,
        searchFn: mockSearch,
      })
    );

    // Dispatch first query (slow)
    act(() => {
      result.current.setQuery('first-slow');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'first-slow',
      expect.objectContaining({ token: 1 })
    );

    // Dispatch second query (fast)
    act(() => {
      result.current.setQuery('second-fast');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockSearch).toHaveBeenCalledWith(
      sampleEntries,
      'second-fast',
      expect.objectContaining({ token: 2 })
    );

    // Second (fast) response completes first with XLM entry
    await act(async () => {
      resolveSecond!({
        items: [sampleEntries[1]],
        total: 1,
        query: 'second-fast',
        token: 2,
      });
    });

    expect(result.current.status).toBe('success');
    expect(result.current.results).toEqual([sampleEntries[1]]);

    // First (slow) response finishes later with USDC entry
    await act(async () => {
      resolveFirst!({
        items: [sampleEntries[0]],
        total: 1,
        query: 'first-slow',
        token: 1,
      });
    });

    // Stale result MUST BE IGNORED: newest result (XLM) remains!
    expect(result.current.results).toEqual([sampleEntries[1]]);
    expect(result.current.debouncedQuery).toBe('second-fast');
  });

  it('edge case 3: no matches -> empty state', async () => {
    const mockSearch = jest.fn().mockResolvedValue({
      items: [],
      total: 0,
      query: 'nomatch',
      token: 1,
    });

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 100,
        searchFn: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('nomatch');
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.results).toEqual([]);
  });

  it('edge case 4: cleared input -> resets results', async () => {
    const mockSearch = jest.fn().mockResolvedValue({
      items: [sampleEntries[0]],
      total: 1,
      query: 'usdc',
      token: 1,
    });

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 100,
        searchFn: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('usdc');
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.status).toBe('success');
    expect(result.current.results).toHaveLength(1);

    // Now clear input
    act(() => {
      result.current.clearQuery();
    });

    // Resets immediately to all sample entries
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toHaveLength(3);
  });

  it('edge case 5: error -> error state with retry', async () => {
    let failFirst = true;
    const mockSearch = jest.fn().mockImplementation((_e, q, opts) => {
      if (failFirst) {
        return Promise.reject(
          new SearchExecutionError('Network failure', 'SEARCH_NETWORK_ERROR')
        );
      }
      return Promise.resolve({
        items: [sampleEntries[0]],
        total: 1,
        query: q,
        token: opts.token,
      });
    });

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 100,
        searchFn: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('usdc');
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Error state
    expect(result.current.status).toBe('error');
    expect(result.current.isError).toBe(true);
    expect(result.current.error?.code).toBe('SEARCH_NETWORK_ERROR');
    expect(result.current.results).toEqual([]);

    // Trigger retry
    failFirst = false;
    await act(async () => {
      result.current.retry();
    });

    // Recovered to success
    expect(result.current.status).toBe('success');
    expect(result.current.isError).toBe(false);
    expect(result.current.results).toEqual([sampleEntries[0]]);
  });

  it('aborts in-flight search on cancel()', () => {
    let capturedSignal: AbortSignal | undefined;
    const mockSearch = jest.fn().mockImplementation((_e, _q, opts) => {
      capturedSignal = opts.signal;
      return new Promise(() => {}); // never resolves
    });

    const { result } = renderHook(() =>
      useDebouncedSwapSearch({
        entries: sampleEntries,
        debounceMs: 100,
        searchFn: mockSearch,
      })
    );

    act(() => {
      result.current.setQuery('test');
    });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(capturedSignal?.aborted).toBe(false);

    act(() => {
      result.current.cancel();
    });

    expect(capturedSignal?.aborted).toBe(true);
  });
});

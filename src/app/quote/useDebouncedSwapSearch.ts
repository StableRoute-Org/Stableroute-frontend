'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  normalizeSearchQuery,
  searchQuotes,
  SearchExecutionError,
  type SearchOptions,
  type SearchQuotesResult,
} from './searchQuotes';
import type { HistoryEntry } from './tableModel';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'empty' | 'error';

export interface UseDebouncedSwapSearchOptions {
  entries: readonly HistoryEntry[];
  initialQuery?: string;
  debounceMs?: number;
  onCommitQuery?: (query: string) => void;
  searchFn?: (
    entries: readonly HistoryEntry[],
    query: string,
    options?: SearchOptions
  ) => Promise<SearchQuotesResult>;
}

export interface UseDebouncedSwapSearchResult {
  query: string;
  debouncedQuery: string;
  status: SearchStatus;
  results: HistoryEntry[];
  error: SearchExecutionError | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
  isIdle: boolean;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  retry: () => void;
  cancel: () => void;
}

const DEFAULT_DEBOUNCE_MS = 250;

/**
 * Custom hook providing robust debounced search with request cancellation,
 * monotonic request token ordering guard against stale/out-of-order responses,
 * and distinct state transitions (idle, loading, success, empty, error).
 */
export function useDebouncedSwapSearch({
  entries,
  initialQuery = '',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  onCommitQuery,
  searchFn = searchQuotes,
}: UseDebouncedSwapSearchOptions): UseDebouncedSwapSearchResult {
  const [query, setQueryState] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<HistoryEntry[]>(() => [...entries]);
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [error, setError] = useState<SearchExecutionError | null>(null);

  const latestTokenRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const onCommitQueryRef = useRef(onCommitQuery);
  onCommitQueryRef.current = onCommitQuery;
  const searchFnRef = useRef(searchFn);
  searchFnRef.current = searchFn;

  // Cleanup pending timer and in-flight request on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update results if initial entries change and we are idle with empty query
  useEffect(() => {
    if (status === 'idle' && !query.trim()) {
      setResults([...entries]);
    }
  }, [entries, status, query]);

  const executeSearch = useCallback(async (searchQuery: string) => {
    const normalized = normalizeSearchQuery(searchQuery);

    if (!normalized) {
      // Empty query resets immediately to all entries
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      latestTokenRef.current += 1;
      setDebouncedQuery('');
      setStatus('idle');
      setError(null);
      setResults([...entriesRef.current]);
      onCommitQueryRef.current?.('');
      return;
    }

    // Abort any in-flight search before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const currentToken = ++latestTokenRef.current;

    setDebouncedQuery(searchQuery);
    setStatus('loading');
    setError(null);
    onCommitQueryRef.current?.(normalized);

    try {
      const res = await searchFnRef.current(entriesRef.current, normalized, {
        signal: controller.signal,
        token: currentToken,
      });

      // Guard: drop response if superseded by a newer request or aborted
      if (
        currentToken !== latestTokenRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      if (res.items.length === 0) {
        setStatus('empty');
        setResults([]);
      } else {
        setStatus('success');
        setResults(res.items);
      }
    } catch (err) {
      // Guard: drop response if superseded or aborted
      if (
        currentToken !== latestTokenRef.current ||
        controller.signal.aborted
      ) {
        return;
      }

      const isAbort =
        (err as { name?: string })?.name === 'AbortError' ||
        (err as Error)?.message?.includes('aborted');
      if (isAbort) {
        return;
      }

      const searchError =
        err instanceof SearchExecutionError
          ? err
          : new SearchExecutionError(
              err instanceof Error ? err.message : 'Search failed',
              'SEARCH_FAILED'
            );

      setStatus('error');
      setError(searchError);
      setResults([]);
    } finally {
      if (currentToken === latestTokenRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, []);

  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      const trimmed = newQuery.trim();
      if (!trimmed) {
        // Immediately reset without waiting for debounce when input is cleared
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        latestTokenRef.current += 1;
        setDebouncedQuery('');
        setStatus('idle');
        setError(null);
        setResults([...entriesRef.current]);
        onCommitQueryRef.current?.('');
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        executeSearch(newQuery);
      }, debounceMs);
    },
    [debounceMs, executeSearch]
  );

  const clearQuery = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  const retry = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    executeSearch(query);
  }, [executeSearch, query]);

  const cancel = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    query,
    debouncedQuery,
    status,
    results,
    error,
    isLoading: status === 'loading',
    isError: status === 'error',
    isEmpty: status === 'empty',
    isSuccess: status === 'success',
    isIdle: status === 'idle',
    setQuery,
    clearQuery,
    retry,
    cancel,
  };
}

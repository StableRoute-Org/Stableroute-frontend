import type { HistoryEntry } from './tableModel';

export interface SearchOptions {
  signal?: AbortSignal;
  token?: number;
  delayMs?: number;
  shouldFail?: boolean;
}

export interface SearchQuotesResult {
  items: HistoryEntry[];
  total: number;
  query: string;
  token: number;
}

export class SearchExecutionError extends Error {
  readonly code: string;

  constructor(message: string, code = 'SEARCH_FAILED') {
    super(message);
    this.name = 'SearchExecutionError';
    this.code = code;
  }
}

/**
 * Normalizes a search query by trimming whitespace and converting to lowercase.
 */
export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/**
 * Searches quote history entries matching the given query string.
 * Supports cancellation via AbortSignal and simulated async delays for concurrency testing.
 */
export async function searchQuotes(
  entries: readonly HistoryEntry[],
  query: string,
  options?: SearchOptions
): Promise<SearchQuotesResult> {
  const token = options?.token ?? 0;
  const signal = options?.signal;
  const delayMs = options?.delayMs ?? 0;

  if (signal?.aborted) {
    const error = new Error('Search request was aborted');
    error.name = 'AbortError';
    throw error;
  }

  if (delayMs > 0) {
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        resolve();
      }, delayMs);

      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            const err = new Error('Search request was aborted');
            err.name = 'AbortError';
            reject(err);
          },
          { once: true }
        );
      }
    });
  }

  if (signal?.aborted) {
    const error = new Error('Search request was aborted');
    error.name = 'AbortError';
    throw error;
  }

  const normalized = normalizeSearchQuery(query);

  if (options?.shouldFail || normalized === 'trigger-error') {
    throw new SearchExecutionError(
      'Unable to search quotes. Please check your connection and try again.',
      'SEARCH_NETWORK_ERROR'
    );
  }

  if (!normalized) {
    return {
      items: [...entries],
      total: entries.length,
      query: '',
      token,
    };
  }

  const matched = entries.filter((entry) => {
    const sourceMatch = entry.source.toLowerCase().includes(normalized);
    const destMatch = entry.dest.toLowerCase().includes(normalized);
    const amountMatch = entry.amount.toLowerCase().includes(normalized);
    const routeMatch = `${entry.source} → ${entry.dest}`
      .toLowerCase()
      .includes(normalized);
    return sourceMatch || destMatch || amountMatch || routeMatch;
  });

  return {
    items: matched,
    total: matched.length,
    query: normalized,
    token,
  };
}

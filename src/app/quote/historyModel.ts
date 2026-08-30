/**
 * Pure model for the "Recent quotes" history list (#723).
 *
 * All functions are side-effect free apart from the explicitly injected
 * storage parameter, so optimistic insert / reconcile / rollback behaviour
 * can be unit tested without React or jsdom tricks.
 */
import type { Quote } from '@/lib/types';

export type QuoteInputs = {
  source: string;
  dest: string;
  amount: string;
};

export type HistoryEntry = QuoteInputs & { savedAt: number };

/** Optimistic entry applied locally before the server confirms it. */
export type PendingHistoryEntry = HistoryEntry & { key: string };

export const HISTORY_KEY = 'stableroute.quote.history';
export const MAX_HISTORY = 5;

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Load confirmed history. Malformed or non-array payloads degrade to an
 * empty list; results are capped at MAX_HISTORY.
 */
export function readHistory(
  storage: ReadStorage = localStorage
): HistoryEntry[] {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

/**
 * Pure counterpart of the historical pushHistory(): prepend `entry`, drop
 * earlier duplicates of the same (source, dest, amount) triple, cap at
 * `max`. Never mutates the input array, keeping ordering of untouched
 * entries stable.
 */
export function pushHistoryPure(
  entries: HistoryEntry[],
  entry: QuoteInputs,
  max: number = MAX_HISTORY,
  savedAt: number = Date.now()
): HistoryEntry[] {
  const next: HistoryEntry[] = [
    {
      source: entry.source,
      dest: entry.dest,
      amount: entry.amount,
      savedAt,
    },
    ...entries.filter(
      (item) =>
        item.source !== entry.source ||
        item.dest !== entry.dest ||
        item.amount !== entry.amount
    ),
  ];
  return next.slice(0, max);
}

/** Persist the confirmed list and echo it back for state updates. */
export function writeHistory(
  entries: HistoryEntry[],
  storage: WriteStorage = localStorage
): HistoryEntry[] {
  storage.setItem(HISTORY_KEY, JSON.stringify(entries));
  return entries;
}

/**
 * Build the canonical confirmed entry from the server's quote response
 * fields, so the stored row always reflects what the backend returned.
 */
export function canonicalEntryFromQuote(
  quote: Pick<Quote, 'source_asset' | 'dest_asset' | 'amount'>,
  savedAt: number = Date.now()
): HistoryEntry {
  return {
    source: quote.source_asset,
    dest: quote.dest_asset,
    amount: quote.amount,
    savedAt,
  };
}

/**
 * Render view for the history list: the optimistic entry (if any) leads,
 * followed by the confirmed rows. Optimistic rows are never persisted.
 */
export function mergePendingEntry(
  confirmed: HistoryEntry[],
  pending: PendingHistoryEntry | null
): HistoryEntry[] {
  return pending ? [pending, ...confirmed] : confirmed;
}

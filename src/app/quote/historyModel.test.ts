import {
  MAX_HISTORY,
  canonicalEntryFromQuote,
  mergePendingEntry,
  pushHistoryPure,
  readHistory,
  type HistoryEntry,
} from './historyModel';

const entry = (
  source: string,
  dest: string,
  amount: string,
  savedAt = 1
): HistoryEntry => ({ source, dest, amount, savedAt });

describe('historyModel', () => {
  describe('readHistory', () => {
    it('returns an empty list when nothing is stored', () => {
      localStorage.clear();
      expect(readHistory()).toEqual([]);
    });

    it('degrades malformed JSON to an empty list', () => {
      localStorage.setItem('stableroute.quote.history', '{not-json');
      expect(readHistory()).toEqual([]);
    });

    it('degrades non-array payloads to an empty list', () => {
      localStorage.setItem(
        'stableroute.quote.history',
        JSON.stringify({ source: 'X' })
      );
      expect(readHistory()).toEqual([]);
    });

    it('caps stored rows at MAX_HISTORY', () => {
      const rows = Array.from({ length: 9 }, (_, i) =>
        entry('A', 'B', String(i), i)
      );
      localStorage.setItem('stableroute.quote.history', JSON.stringify(rows));
      expect(readHistory()).toHaveLength(MAX_HISTORY);
    });
  });

  describe('pushHistoryPure', () => {
    it('prepends the new entry without mutating the input array', () => {
      const existing = [entry('A', 'B', '1')];
      const next = pushHistoryPure(existing, { source: 'C', dest: 'D', amount: '2' }, MAX_HISTORY, 7);

      expect(existing).toEqual([entry('A', 'B', '1')]);
      expect(next[0]).toEqual({ source: 'C', dest: 'D', amount: '2', savedAt: 7 });
      expect(next).toHaveLength(2);
    });

    it('dedupes by the (source, dest, amount) triple, moving the match to the front', () => {
      const existing = [
        entry('A', 'B', '1', 10),
        entry('E', 'F', '3', 20),
      ];
      const next = pushHistoryPure(existing, { source: 'A', dest: 'B', amount: '1' }, MAX_HISTORY, 30);

      expect(next[0].savedAt).toBe(30);
      expect(next).toHaveLength(2);
      expect(next[1].source).toBe('E');
      // Same source/dest but a different amount is NOT a duplicate.
      expect(next.filter((e) => e.source === 'A')).toHaveLength(1);
    });

    it('caps the list at max entries and keeps relative order of survivors', () => {
      let rows: HistoryEntry[] = [entry('S1', 'D', '1'), entry('S2', 'D', '2')];
      for (let i = 3; i <= 7; i++) {
        rows = pushHistoryPure(rows, { source: `S${i}`, dest: 'D', amount: String(i) }, 5, i);
      }
      expect(rows).toHaveLength(5);
      expect(rows.map((r) => r.source)).toEqual(['S7', 'S6', 'S5', 'S4', 'S3']);
    });
  });

  describe('canonicalEntryFromQuote', () => {
    it('maps server response fields onto the canonical history triple', () => {
      expect(
        canonicalEntryFromQuote(
          { source_asset: 'usdc', dest_asset: 'xlm', amount: '1000' },
          42
        )
      ).toEqual({ source: 'usdc', dest: 'xlm', amount: '1000', savedAt: 42 });
    });
  });

  describe('mergePendingEntry', () => {
    it('leads with the optimistic entry when one is pending', () => {
      const confirmed = [entry('A', 'B', '1')];
      const pending = { ...entry('C', 'D', '2', 5), key: 'pending-1' };

      const view = mergePendingEntry(confirmed, pending);
      expect(view[0]).toBe(pending);
      expect(view.slice(1)).toEqual(confirmed);
    });

    it('returns only confirmed rows when nothing is pending', () => {
      const confirmed = [entry('A', 'B', '1')];
      expect(mergePendingEntry(confirmed, null)).toEqual(confirmed);
    });
  });
});

import {
  normalizeSearchQuery,
  searchQuotes,
  SearchExecutionError,
} from './searchQuotes';
import type { HistoryEntry } from './tableModel';

describe('searchQuotes', () => {
  const sampleEntries: HistoryEntry[] = [
    { source: 'USDC', dest: 'EURC', amount: '1000', savedAt: 1000 },
    { source: 'XLM', dest: 'USDC', amount: '500', savedAt: 2000 },
    { source: 'BTC', dest: 'ETH', amount: '250', savedAt: 3000 },
    { source: 'EURC', dest: 'USDT', amount: '750', savedAt: 4000 },
  ];

  describe('normalizeSearchQuery', () => {
    it('trims leading/trailing whitespace and converts to lowercase', () => {
      expect(normalizeSearchQuery('  USDC  ')).toBe('usdc');
      expect(normalizeSearchQuery('XLM')).toBe('xlm');
      expect(normalizeSearchQuery('   ')).toBe('');
    });
  });

  describe('filtering and matching', () => {
    it('returns all entries when query is empty or only whitespace', async () => {
      const res1 = await searchQuotes(sampleEntries, '');
      expect(res1.items).toHaveLength(4);
      expect(res1.total).toBe(4);
      expect(res1.query).toBe('');

      const res2 = await searchQuotes(sampleEntries, '   ');
      expect(res2.items).toHaveLength(4);
      expect(res2.total).toBe(4);
      expect(res2.query).toBe('');
    });

    it('matches entries by source asset code', async () => {
      const res = await searchQuotes(sampleEntries, 'xlm');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].source).toBe('XLM');
      expect(res.total).toBe(1);
    });

    it('matches entries by destination asset code', async () => {
      const res = await searchQuotes(sampleEntries, 'eurc');
      expect(res.items).toHaveLength(2);
      expect(res.items.map((e) => e.source)).toEqual(['USDC', 'EURC']);
    });

    it('matches entries by amount', async () => {
      const res = await searchQuotes(sampleEntries, '500');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].amount).toBe('500');
    });

    it('matches entries by route string', async () => {
      const res = await searchQuotes(sampleEntries, 'btc → eth');
      expect(res.items).toHaveLength(1);
      expect(res.items[0].source).toBe('BTC');
      expect(res.items[0].dest).toBe('ETH');
    });

    it('returns empty list when no entries match', async () => {
      const res = await searchQuotes(sampleEntries, 'nonexistent');
      expect(res.items).toEqual([]);
      expect(res.total).toBe(0);
      expect(res.query).toBe('nonexistent');
    });

    it('preserves the token passed in options', async () => {
      const res = await searchQuotes(sampleEntries, 'usdc', { token: 42 });
      expect(res.token).toBe(42);
    });
  });

  describe('cancellation and delays', () => {
    it('throws AbortError immediately if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        searchQuotes(sampleEntries, 'usdc', { signal: controller.signal })
      ).rejects.toThrow('Search request was aborted');
    });

    it('aborts during simulated delay when signal fires', async () => {
      const controller = new AbortController();
      const promise = searchQuotes(sampleEntries, 'usdc', {
        delayMs: 100,
        signal: controller.signal,
      });

      setTimeout(() => controller.abort(), 20);

      await expect(promise).rejects.toThrow('Search request was aborted');
    });

    it('completes successfully if delay finishes before abort', async () => {
      const controller = new AbortController();
      const res = await searchQuotes(sampleEntries, 'usdc', {
        delayMs: 10,
        signal: controller.signal,
      });

      expect(res.items.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('throws structured SearchExecutionError when shouldFail is true', async () => {
      await expect(
        searchQuotes(sampleEntries, 'usdc', { shouldFail: true })
      ).rejects.toThrow(SearchExecutionError);

      try {
        await searchQuotes(sampleEntries, 'usdc', { shouldFail: true });
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SearchExecutionError);
        expect((err as SearchExecutionError).code).toBe('SEARCH_NETWORK_ERROR');
      }
    });

    it('throws structured SearchExecutionError for trigger-error query', async () => {
      await expect(
        searchQuotes(sampleEntries, 'trigger-error')
      ).rejects.toThrow(SearchExecutionError);
    });
  });
});

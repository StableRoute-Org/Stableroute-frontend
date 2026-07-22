import { filterPairs, groupBySource, type Pair } from './pairsUtils';

const PAIRS: Pair[] = [
  { source: 'USDC', destination: 'EURC' },
  { source: 'BTC', destination: 'USDC' },
  { source: 'USDC', destination: 'NGNC' },
];

describe('filterPairs', () => {
  it('matches source asset codes case-insensitively', () => {
    expect(filterPairs(PAIRS, 'btc')).toEqual([
      { source: 'BTC', destination: 'USDC' },
    ]);
  });

  it('matches destination asset codes case-insensitively', () => {
    expect(filterPairs(PAIRS, 'eurc')).toEqual([
      { source: 'USDC', destination: 'EURC' },
    ]);
  });

  it('returns an empty array when no pair matches', () => {
    expect(filterPairs(PAIRS, 'XLM')).toEqual([]);
  });

  it.each(['', '   ', '\t\n'])(
    'returns the original array for an empty query %j',
    (query) => {
      expect(filterPairs(PAIRS, query)).toBe(PAIRS);
    }
  );
});

describe('groupBySource', () => {
  it('sorts source groups and their destinations deterministically', () => {
    expect(groupBySource(PAIRS)).toEqual([
      ['BTC', ['USDC']],
      ['USDC', ['EURC', 'NGNC']],
    ]);
  });

  it('preserves duplicate pairs', () => {
    const duplicates: Pair[] = [
      { source: 'USDC', destination: 'EURC' },
      { source: 'USDC', destination: 'EURC' },
    ];

    expect(groupBySource(duplicates)).toEqual([['USDC', ['EURC', 'EURC']]]);
  });

  it('does not mutate the input order', () => {
    const pairs = [...PAIRS];
    const before = [...pairs];

    groupBySource(pairs);

    expect(pairs).toEqual(before);
  });

  it('returns no groups for empty input', () => {
    expect(groupBySource([])).toEqual([]);
  });
});

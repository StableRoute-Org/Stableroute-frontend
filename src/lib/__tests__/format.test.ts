import {
  formatCompactNumber,
  formatCompactNumberDisplay,
  formatNumber,
  formatQuoteAmountDisplay,
  formatQuoteRateDisplay,
  formatStroops,
  formatTime,
  formatTimestamp,
} from '../format';

describe('format', () => {
  it('formatStroops scales to XLM', () => {
    expect(formatStroops(0)).toBe('0 XLM');
    expect(formatStroops(10_000_000)).toBe('1.00 XLM');
    expect(formatStroops(1_000)).toBe('1000 stroops');
  });
  it('formatNumber adds separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
  describe('formatCompactNumber', () => {
    it('leaves small numbers unchanged', () => {
      expect(formatCompactNumber(0)).toBe('0');
      expect(formatCompactNumber(123)).toBe('123');
      expect(formatCompactNumber(999)).toBe('999');
    });

    it('formats thousands at boundary (1,000 to K)', () => {
      expect(formatCompactNumber(1_000)).toBe('1K');
      expect(formatCompactNumber(1_200)).toBe('1.2K');
      expect(formatCompactNumber(999_499)).toBe('999.5K');
    });

    it('formats millions at boundary (1,000,000 to M)', () => {
      expect(formatCompactNumber(1_000_000)).toBe('1M');
      expect(formatCompactNumber(1_500_000)).toBe('1.5M');
      expect(formatCompactNumber(12_345_678)).toBe('12.3M');
    });

    it('formats billions at boundary (1,000,000,000 to B)', () => {
      expect(formatCompactNumber(1_000_000_000)).toBe('1B');
      expect(formatCompactNumber(2_500_000_000)).toBe('2.5B');
    });

    it('handles negative values', () => {
      expect(formatCompactNumber(-999)).toBe('-999');
      expect(formatCompactNumber(-1_000)).toBe('-1K');
      expect(formatCompactNumber(-1_500_000)).toBe('-1.5M');
      expect(formatCompactNumber(-2_500_000_000)).toBe('-2.5B');
    });

    it('handles non-finite numbers', () => {
      expect(formatCompactNumber(NaN)).toBe('NaN');
      expect(formatCompactNumber(Infinity)).toBe('Infinity');
    });

    it('supports custom locales', () => {
      expect(formatCompactNumber(1_500_000, 'de-DE')).toBe('1,5\u00a0Mio.');
    });
  });

  describe('formatCompactNumberDisplay', () => {
    it('returns compact display and formatted title', () => {
      expect(formatCompactNumberDisplay(1_234_567)).toEqual({
        display: '1.2M',
        title: '1,234,567',
      });
      expect(formatCompactNumberDisplay(999)).toEqual({
        display: '999',
        title: '999',
      });
      expect(formatCompactNumberDisplay(-1_000)).toEqual({
        display: '-1K',
        title: '-1,000',
      });
    });

    it('handles non-finite numbers gracefully', () => {
      expect(formatCompactNumberDisplay(NaN)).toEqual({
        display: 'NaN',
        title: 'NaN',
      });
    });
  });

  it('formatTime returns HH:MM:SS', () => {
    expect(formatTime(0)).toBe('00:00:00');
  });
  it('formatQuoteAmountDisplay falls back for non-numeric input', () => {
    expect(formatQuoteAmountDisplay('abc')).toEqual({
      display: 'abc',
      title: 'abc',
    });
  });
  it('formatQuoteAmountDisplay formats base units via formatStroops', () => {
    expect(formatQuoteAmountDisplay('10000000')).toEqual({
      display: '1.00 XLM',
      title: '10000000',
    });
  });
  it('formatQuoteRateDisplay preserves the raw rate in title', () => {
    expect(formatQuoteRateDisplay('1234.5')).toEqual({
      display: '1,234.5',
      title: '1234.5',
    });
  });
  it('formatTimestamp renders a locale date/time', () => {
    expect(formatTimestamp(Date.UTC(2024, 0, 15, 12, 30))).toMatch(
      /Jan 15, 2024/
    );
  });
});

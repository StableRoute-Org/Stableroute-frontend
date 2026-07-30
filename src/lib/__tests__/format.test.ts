import {
  formatCurrency,
  formatDecimals,
  formatNumber,
  formatPercent,
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
  it('formatQuoteRateDisplay falls back for non-finite input', () => {
    expect(formatQuoteRateDisplay('abc')).toEqual({
      display: 'abc',
      title: 'abc',
    });
  });
  it('formatQuoteRateDisplay formats integer rates with thousands separators', () => {
    expect(formatQuoteRateDisplay('1234')).toEqual({
      display: '1,234',
      title: '1234',
    });
  });
  it('formatTimestamp renders a locale date/time', () => {
    expect(formatTimestamp(Date.UTC(2024, 0, 15, 12, 30))).toMatch(
      /Jan 15, 2024/
    );
  });

  describe('formatDecimals', () => {
    it('rounds to the requested fraction digits', () => {
      expect(formatDecimals(1234.5678, 2)).toBe('1,234.57');
      expect(formatDecimals(1234.5678, 0)).toBe('1,235');
      expect(formatDecimals(1234.5678, 4)).toBe('1,234.5678');
    });

    it('handles zero', () => {
      expect(formatDecimals(0, 2)).toBe('0.00');
      expect(formatDecimals(0, 0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatDecimals(-1234.5, 2)).toBe('-1,234.50');
      expect(formatDecimals(-0.5, 0)).toBe('-1');
    });

    it('handles rounding boundaries', () => {
      expect(formatDecimals(0.005, 2)).toBe('0.01');
      expect(formatDecimals(0.004, 2)).toBe('0.00');
      expect(formatDecimals(1.995, 2)).toBe('2.00');
    });

    it('handles large numbers with thousands separators', () => {
      expect(formatDecimals(1234567.89, 2)).toBe('1,234,567.89');
    });

    it('handles values with no integer part', () => {
      expect(formatDecimals(0.5, 2)).toBe('0.50');
    });
  });

  describe('formatCurrency', () => {
    it('formats with thousands separators and a currency symbol', () => {
      expect(formatCurrency(1234.5, 'USD')).toBe('1,234.50 USD');
      expect(formatCurrency(1000000, 'XLM')).toBe('1,000,000.00 XLM');
    });

    it('omits the symbol when empty', () => {
      expect(formatCurrency(42, '')).toBe('42.00');
    });

    it('handles zero', () => {
      expect(formatCurrency(0, 'XLM')).toBe('0.00 XLM');
    });

    it('handles negative amounts', () => {
      expect(formatCurrency(-99.9, 'EUR')).toBe('-99.90 EUR');
    });

    it('preserves rounding from formatDecimals', () => {
      expect(formatCurrency(1.005, 'USD')).toBe('1.01 USD');
      expect(formatCurrency(1.004, 'USD')).toBe('1.00 USD');
    });
  });

  describe('formatPercent', () => {
    it('multiplies decimal by 100 and appends %', () => {
      expect(formatPercent(0.0042, 2)).toBe('0.42%');
      expect(formatPercent(0.5, 2)).toBe('50.00%');
      expect(formatPercent(1, 2)).toBe('100.00%');
    });

    it('handles zero', () => {
      expect(formatPercent(0, 2)).toBe('0.00%');
    });

    it('handles negative decimals', () => {
      expect(formatPercent(-0.015, 2)).toBe('-1.50%');
      expect(formatPercent(-0.5, 2)).toBe('-50.00%');
    });

    it('handles rounding boundaries', () => {
      expect(formatPercent(0.00005, 2)).toBe('0.01%');
      expect(formatPercent(0.00004, 2)).toBe('0.00%');
    });

    it('handles larger fraction digit counts', () => {
      expect(formatPercent(0.00123, 4)).toBe('0.1230%');
      expect(formatPercent(0.001, 0)).toBe('0%');
    });
  });
});

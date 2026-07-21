import {
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

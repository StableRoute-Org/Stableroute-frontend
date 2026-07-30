/** Format a stroops amount as a human XLM number (1 XLM = 1e7 stroops). */
export function formatStroops(stroops: number): string {
  const xlm = stroops / 1e7;
  if (xlm === 0) return '0 XLM';
  if (xlm < 0.01) return `${stroops} stroops`;
  return `${formatDecimals(xlm, 2)} XLM`;
}

/** Format a numeric count with thousands separators. */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format a number to a fixed number of decimal places with thousands separators.
 *
 * Examples:
 *   formatDecimals(1234.5, 0) → "1,234"
 *   formatDecimals(1234.5678, 2) → "1,234.57"
 *   formatDecimals(0, 2) → "0.00"
 */
export function formatDecimals(value: number, fractionDigits: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

/**
 * Format a number as a currency amount with thousands separators and a
 * configurable symbol suffix.
 *
 * Always uses 2 decimal places. Pass an empty symbol to omit it.
 *
 * Examples:
 *   formatCurrency(1234.5, 'USD') → "1,234.50 USD"
 *   formatCurrency(42, '') → "42.00"
 *   formatCurrency(0, 'XLM') → "0.00 XLM"
 *   formatCurrency(-99.9, 'EUR') → "-99.90 EUR"
 */
export function formatCurrency(value: number, symbol: string): string {
  const formatted = formatDecimals(value, 2);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Format a decimal fraction as a percentage string.
 *
 * Multiplies the input by 100 internally, so pass the raw decimal (e.g. 0.0042
 * for 0.42%).
 *
 * Examples:
 *   formatPercent(0.0042, 2) → "0.42%"
 *   formatPercent(0, 2) → "0.00%"
 *   formatPercent(-0.015, 2) → "-1.50%"
 */
export function formatPercent(decimal: number, fractionDigits: number): string {
  return `${(decimal * 100).toFixed(fractionDigits)}%`;
}

/** Human-readable quote amount with the raw base-unit string preserved for operators. */
export function formatQuoteAmountDisplay(amount: string): {
  display: string;
  title: string;
} {
  const parsed = Number(amount);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return { display: amount, title: amount };
  }
  return { display: formatStroops(parsed), title: amount };
}

/** Human-readable quote rate with the raw API value preserved for operators. */
export function formatQuoteRateDisplay(rate: string): {
  display: string;
  title: string;
} {
  const parsed = Number(rate);
  if (!Number.isFinite(parsed)) {
    return { display: rate, title: rate };
  }
  const display = Number.isInteger(parsed)
    ? formatNumber(parsed)
    : parsed.toLocaleString('en-US', { maximumFractionDigits: 6 });
  return { display, title: rate };
}

/** Format an absolute timestamp into a short HH:MM:SS string. */
export function formatTime(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

/** Format a timestamp for absolute display (locale-aware date + time). */
export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

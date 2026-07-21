/** Format a stroops amount as a human XLM number (1 XLM = 1e7 stroops). */
export function formatStroops(stroops: number): string {
  const xlm = stroops / 1e7;
  if (xlm === 0) return '0 XLM';
  if (xlm < 0.01) return `${stroops} stroops`;
  return `${xlm.toFixed(2)} XLM`;
}

/** Format a numeric count with thousands separators. */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
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

/** Format a stroops amount as a human XLM number (1 XLM = 1e7 stroops). */
export function formatStroops(stroops: number): string {
  const xlm = stroops / 1e7;
  if (xlm === 0) return "0 XLM";
  if (xlm < 0.01) return `${stroops} stroops`;
  return `${xlm.toFixed(2)} XLM`;
}

/** Format a numeric count with thousands separators. */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/** Format an absolute timestamp into a short HH:MM:SS string. */
export function formatTime(ms: number): string {
  return new Date(ms).toISOString().slice(11, 19);
}

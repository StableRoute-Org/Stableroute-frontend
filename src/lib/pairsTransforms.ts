export type Pair = { source: string; destination: string };

/**
 * Filter pairs by a case-insensitive substring match on source or destination.
 * Returns the original array when the query is empty. Never mutates the input.
 */
export function filterPairs(pairs: Pair[], query: string): Pair[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return pairs;
  return pairs.filter(
    (pair) =>
      pair.source.toLowerCase().includes(needle) ||
      pair.destination.toLowerCase().includes(needle)
  );
}

/**
 * Group pairs by source asset into a deterministically-sorted array of
 * `[source, destinations[]]` tuples. Sources and destinations are both sorted
 * alphabetically; the input is never mutated.
 */
export function groupBySource(pairs: Pair[]): [string, string[]][] {
  const map = new Map<string, string[]>();
  for (const { source, destination } of pairs) {
    const entry = map.get(source);
    if (entry) entry.push(destination);
    else map.set(source, [destination]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, destinations]) => [
      source,
      [...destinations].sort((a, b) => a.localeCompare(b)),
    ]);
}

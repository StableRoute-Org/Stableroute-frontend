export type Pair = { source: string; destination: string };

/**
 * Filters pairs whose source or destination contains the query text
 * (case-insensitive). An empty/whitespace-only query returns `pairs`
 * unchanged (same array reference — no new array is allocated).
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
 * Groups an array of pairs by their source asset.
 *
 * Returns a deterministically-sorted array of tuples, each pairing a source
 * with its sorted destination list. The original `pairs` array is never
 * mutated and iteration order across sources is stable.
 *
 * @param pairs - The raw pairs array returned by the API.
 * @returns An array of `[source, destinations[]]` tuples sorted
 *          alphabetically by source, with destinations also sorted.
 */
export function groupBySource(pairs: Pair[]): [string, string[]][] {
  const map = new Map<string, string[]>();
  for (const { source, destination } of pairs) {
    const entry = map.get(source);
    if (entry) {
      entry.push(destination);
    } else {
      map.set(source, [destination]);
    }
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([source, destinations]) => [
      source,
      destinations.sort((a, b) => a.localeCompare(b)),
    ]);
}

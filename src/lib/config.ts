/** Default local API base when no env override is set. */
export const DEFAULT_API_BASE = "http://localhost:3001";

/**
 * Resolved StableRoute API base URL (env override or local default).
 * Rejects non-http(s) schemes and values that fail URL parsing.
 */
export function getApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? DEFAULT_API_BASE;
  validateApiBase(raw);
  return raw.replace(/\/$/, "");
}

/** Validates a configured API base URL for safe browser use. */
export function validateApiBase(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_STABLEROUTE_API_BASE must be a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("API base must use http or https");
  }
}

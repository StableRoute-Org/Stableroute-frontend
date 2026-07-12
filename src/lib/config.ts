/** Resolved StableRoute API base URL (env override or local default). */
export function getApiBase(): string {
  return process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE ?? "http://localhost:3001";
}

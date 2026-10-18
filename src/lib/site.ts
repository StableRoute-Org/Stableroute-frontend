import { getApiBase } from '@/lib/config';

/** Deployed StableRouteRouter contract on Stellar testnet (override via env). */
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_STABLEROUTE_CONTRACT_ID ??
  'CCKXEUALSDINT6FWCPZRK4BS5NJ5J5JBGM6GAKHSB6JAN7MOTWFI6IHD';

export const STELLAR_NETWORK =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? 'testnet';

export const CONTRACT_EXPLORER_URL = `https://stellar.expert/explorer/${STELLAR_NETWORK}/contract/${CONTRACT_ID}`;

export const GITHUB_ORG_URL = 'https://github.com/StableRoute-Org';

export const REPOS = {
  frontend: `${GITHUB_ORG_URL}/Stableroute-frontend`,
  backend: `${GITHUB_ORG_URL}/Stableroute-backend`,
  contracts: `${GITHUB_ORG_URL}/Stableroute-contracts`,
} as const;

/** Links derived from the configured backend origin. */
export function getApiLinks() {
  const base = getApiBase();
  return {
    base,
    docs: `${base}/docs`,
    health: `${base}/health`,
    openapi: `${base}/openapi.yaml`,
  };
}

export function shortId(id: string, head = 6, tail = 6): string {
  return id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`;
}

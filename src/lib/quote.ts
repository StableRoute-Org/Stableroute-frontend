export type Quote = {
  source_asset: string;
  dest_asset: string;
  amount: string;
  estimated_rate: string;
  route: string[];
};

const AMOUNT_PATTERN = /^[1-9][0-9]{0,38}$/;

export function normalizeAsset(asset: string) {
  return asset;
}

export function assetsDiffer(a: string, b: string) {
  return normalizeAsset(a) !== normalizeAsset(b);
}

export function isValidAmount(value: string) {
  return AMOUNT_PATTERN.test(value);
}

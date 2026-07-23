import { assetsDiffer, isValidAmount, normalizeAsset } from "../quote";

describe("quote validators", () => {
  describe("isValidAmount", () => {
    it("accepts positive integer base-unit amounts up to 39 digits", () => {
      expect(isValidAmount("1")).toBe(true);
      expect(isValidAmount("1000000")).toBe(true);
      expect(isValidAmount("9".repeat(39))).toBe(true);
    });

    it("rejects empty, zero, leading zero, non-digit, and overflow values", () => {
      expect(isValidAmount("")).toBe(false);
      expect(isValidAmount("0")).toBe(false);
      expect(isValidAmount("01")).toBe(false);
      expect(isValidAmount("1.5")).toBe(false);
      expect(isValidAmount("1_000")).toBe(false);
      expect(isValidAmount("9".repeat(40))).toBe(false);
    });
  });

  describe("assetsDiffer", () => {
    it("rejects the same asset after normalization", () => {
      expect(assetsDiffer("USDC", "USDC")).toBe(false);
    });

    it("accepts different assets after normalization", () => {
      expect(assetsDiffer("USDC", "EURC")).toBe(true);
    });

    it("keeps current exact-string asset normalization behavior", () => {
      expect(normalizeAsset(" usdc ")).toBe(" usdc ");
      expect(assetsDiffer("USDC", "usdc")).toBe(true);
    });
  });
});

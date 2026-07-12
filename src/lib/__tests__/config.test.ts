import { getApiBase } from "../config";

describe("getApiBase", () => {
  const original = process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    } else {
      process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = original;
    }
  });

  it("returns the env override when set", () => {
    process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE = "https://api.example.test";
    expect(getApiBase()).toBe("https://api.example.test");
  });

  it("falls back to localhost when unset", () => {
    delete process.env.NEXT_PUBLIC_STABLEROUTE_API_BASE;
    expect(getApiBase()).toBe("http://localhost:3001");
  });
});

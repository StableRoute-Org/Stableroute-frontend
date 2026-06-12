import { formatNumber, formatStroops, formatTime } from "../format";

describe("format", () => {
  it("formatStroops scales to XLM", () => {
    expect(formatStroops(0)).toBe("0 XLM");
    expect(formatStroops(10_000_000)).toBe("1.00 XLM");
    expect(formatStroops(1_000)).toBe("1000 stroops");
  });
  it("formatNumber adds separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
  it("formatTime returns HH:MM:SS", () => {
    expect(formatTime(0)).toBe("00:00:00");
  });
});

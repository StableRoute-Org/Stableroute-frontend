import { effectiveTheme, readTheme, writeTheme } from "../theme";

const originalLocalStorage = window.localStorage;
const originalMatchMedia = window.matchMedia;

function replaceLocalStorage(storage: Partial<Storage>) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: storage,
  });
}

afterEach(() => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: originalLocalStorage,
  });
  window.localStorage.clear();
  window.matchMedia = originalMatchMedia;
  jest.restoreAllMocks();
});

describe("theme storage helpers", () => {
  it("round-trips valid stored themes", () => {
    writeTheme("dark");

    expect(window.localStorage.getItem("stableroute.theme")).toBe("dark");
    expect(readTheme()).toBe("dark");
  });

  it("falls back to system for missing or corrupted stored values", () => {
    expect(readTheme()).toBe("system");

    window.localStorage.setItem("stableroute.theme", "midnight");
    expect(readTheme()).toBe("system");
  });

  it("falls back to system when localStorage.getItem throws", () => {
    replaceLocalStorage({
      getItem: jest.fn(() => {
        throw new Error("storage disabled");
      }),
    });

    expect(readTheme()).toBe("system");
  });

  it("treats write failures as a no-op", () => {
    const setItem = jest.fn(() => {
      throw new Error("quota exceeded");
    });
    replaceLocalStorage({ setItem });

    expect(() => writeTheme("light")).not.toThrow();
    expect(setItem).toHaveBeenCalledWith("stableroute.theme", "light");
  });
});

describe("effectiveTheme", () => {
  it("returns explicit light or dark themes without media queries", () => {
    expect(effectiveTheme("light")).toBe("light");
    expect(effectiveTheme("dark")).toBe("dark");
  });

  it("resolves system through prefers-color-scheme", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });

    expect(effectiveTheme("system")).toBe("dark");
    expect(window.matchMedia).toHaveBeenCalledWith(
      "(prefers-color-scheme: dark)",
    );
  });
});

import { effectiveTheme, isTheme, readTheme, writeTheme } from "../theme";

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

describe("isTheme", () => {
  it("accepts each valid theme value", () => {
    expect(isTheme("light")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("system")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isTheme("midnight")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
    expect(isTheme(42)).toBe(false);
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

  it("resolves system to light when the OS does not prefer dark", () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });

    expect(effectiveTheme("system")).toBe("light");
  });

  it("defaults system to light when running without a window (SSR)", () => {
    const win = global.window;
    // @ts-expect-error -- simulating a server environment for this call
    delete global.window;
    try {
      expect(effectiveTheme("system")).toBe("light");
    } finally {
      global.window = win;
    }
  });
});

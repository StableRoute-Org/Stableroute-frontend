import { effectiveTheme, readTheme, writeTheme } from "../theme";

const STORAGE_KEY = "stableroute.theme";
const originalWindow = globalThis.window;

function mockMatchMedia(matches: boolean) {
  // Theme helpers only read `.matches`; the rest mirrors the browser shape.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: jest.fn().mockReturnValue({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
}

function withoutWindow<T>(fn: () => T): T {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: undefined,
  });
  try {
    return fn();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  }
}

describe("theme helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockMatchMedia(false);
  });

  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it.each(["light", "dark", "system"] as const)(
    "reads valid stored theme %s",
    (theme) => {
      window.localStorage.setItem(STORAGE_KEY, theme);

      expect(readTheme()).toBe(theme);
    }
  );

  it("falls back to system when no stored theme exists", () => {
    expect(readTheme()).toBe("system");
  });

  it("falls back to system for invalid stored values", () => {
    window.localStorage.setItem(STORAGE_KEY, "blue");

    expect(readTheme()).toBe("system");
  });

  it("writes the selected theme to localStorage", () => {
    writeTheme("dark");

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
  });

  it("passes explicit themes through as effective themes", () => {
    expect(effectiveTheme("light")).toBe("light");
    expect(effectiveTheme("dark")).toBe("dark");
  });

  it("resolves system to dark when the media query matches", () => {
    mockMatchMedia(true);

    expect(effectiveTheme("system")).toBe("dark");
    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
  });

  it("resolves system to light when the media query does not match", () => {
    mockMatchMedia(false);

    expect(effectiveTheme("system")).toBe("light");
  });

  it("uses SSR-safe defaults when window is unavailable", () => {
    withoutWindow(() => {
      expect(readTheme()).toBe("system");
      expect(effectiveTheme("system")).toBe("light");
      expect(() => writeTheme("dark")).not.toThrow();
    });
  });
});

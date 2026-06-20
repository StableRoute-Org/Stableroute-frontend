import { buildThemeInitScript } from "@/lib/themeScript";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function installMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: prefersDark,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

function runThemeScript() {
  new Function(buildThemeInitScript())();
}

describe("buildThemeInitScript", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    installMatchMedia(false);
  });

  it("applies the stored dark theme before hydration", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");

    runThemeScript();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("removes dark mode when the stored theme is light", () => {
    document.documentElement.classList.add("dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "light");

    runThemeScript();

    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("uses prefers-color-scheme when the stored theme is system", () => {
    installMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "system");

    runThemeScript();

    expect(window.matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("falls back to system for invalid stored values", () => {
    installMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, "blue");

    runThemeScript();

    expect(document.documentElement).toHaveClass("dark");
  });

  it("does not throw if localStorage is unavailable", () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(() => runThemeScript()).not.toThrow();
    expect(document.documentElement).not.toHaveClass("dark");

    getItem.mockRestore();
  });
});

export type Theme = "light" | "dark" | "system";

const KEY = "stableroute.theme";

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";

  try {
    const v = window.localStorage.getItem(KEY);
    return isTheme(v) ? v : "system";
  } catch {
    return "system";
  }
}

export function writeTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(KEY, theme);
  } catch {
    // Storage can throw in privacy modes; theme writes are best-effort only.
  }
}

export function effectiveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

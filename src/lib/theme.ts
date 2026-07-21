import {
  rawStringSerializer,
  readLocalStorageValue,
  writeLocalStorageValue,
} from './useLocalStorage';

export type Theme = 'light' | 'dark' | 'system';

// Also hardcoded in public/theme-init.js, which runs before React hydrates
// and cannot import this module. Keep both in sync if this ever changes.
export const THEME_KEY = 'stableroute.theme';

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system';
}

// Stored as a plain string ("dark", not '"dark"') so it stays byte-for-byte
// compatible with theme-init.js's raw localStorage.getItem() comparison and
// with values persisted before this module existed.
export function readTheme(): Theme {
  return readLocalStorageValue(
    THEME_KEY,
    'system',
    isTheme,
    rawStringSerializer
  );
}

export function writeTheme(theme: Theme) {
  writeLocalStorageValue(THEME_KEY, theme, rawStringSerializer);
}

export function effectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

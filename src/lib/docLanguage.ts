'use client';

import type { Language } from '@/components/CodeSample';

const STORAGE_KEY = 'stableroute.docs.lang';

/**
 * Read the persisted docs language preference from sessionStorage.
 * Falls back to 'curl' when running on the server, when storage is
 * unavailable, when the value is corrupt, or when the value is an
 * unsupported language.
 */
export function readDocLanguage(): Language {
  if (typeof window === 'undefined') return 'curl';
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw === 'curl' || raw === 'javascript') return raw;
  } catch {
    /* private mode */
  }
  return 'curl';
}

/**
 * Persist the docs language preference to sessionStorage.
 * Best-effort: silently ignores server-side, private-mode, and
 * quota-exceeded failures.
 */
export function writeDocLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* quota / private mode */
  }
}

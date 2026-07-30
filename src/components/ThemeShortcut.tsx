'use client';

import { useCallback, useEffect } from 'react';
import { rawStringSerializer, useLocalStorage } from '@/lib/useLocalStorage';
import { effectiveTheme, isTheme, THEME_KEY, type Theme } from '@/lib/theme';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  );
}

/**
 * Registers a global keydown listener that toggles between light and dark
 * themes when the user presses Ctrl+Shift+L (Cmd+Shift+L on macOS).
 * The shortcut is ignored while focus is inside an editable element
 * (input, textarea, select, or contentEditable).
 */
export function ThemeShortcut() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    THEME_KEY,
    'system',
    isTheme,
    rawStringSerializer
  );

  const toggleTheme = useCallback(() => {
    const resolved = effectiveTheme(theme);
    const next: Theme = resolved === 'dark' ? 'light' : 'dark';
    setTheme(next);
  }, [theme, setTheme]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'l';

      if (isShortcut) {
        event.preventDefault();
        toggleTheme();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleTheme]);

  useEffect(() => {
    document.documentElement.classList.toggle(
      'dark',
      effectiveTheme(theme) === 'dark'
    );
  }, [theme]);

  return null;
}

import { fireEvent, render } from '@testing-library/react';
import { ThemeShortcut } from '../ThemeShortcut';

const THEME_KEY = 'stableroute.theme';

describe('ThemeShortcut', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const pressShortcut = (options: Partial<KeyboardEventInit> = {}) => {
    fireEvent.keyDown(window, {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      ...options,
    });
  };

  describe('shortcut toggles theme', () => {
    it('toggles from light to dark when currently light', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      pressShortcut();

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('toggles from dark to light when currently dark', () => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      render(<ThemeShortcut />);

      pressShortcut();

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });

    it('toggles from system (resolved light) to dark', () => {
      window.localStorage.setItem(THEME_KEY, 'system');
      render(<ThemeShortcut />);

      pressShortcut();

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('toggles from system (resolved dark) to light', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      window.localStorage.setItem(THEME_KEY, 'system');
      render(<ThemeShortcut />);

      pressShortcut();

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });

    it('defaults to system when no stored value and toggles to dark', () => {
      render(<ThemeShortcut />);

      pressShortcut();

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });
  });

  describe('repeated presses', () => {
    it('toggles back and forth with repeated presses', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('toggles correctly when starting from system theme', () => {
      window.localStorage.setItem(THEME_KEY, 'system');
      render(<ThemeShortcut />);

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      pressShortcut();
      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });
  });

  describe('dark class on document root', () => {
    it('adds dark class when toggling to dark', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      expect(document.documentElement.classList.contains('dark')).toBe(false);

      pressShortcut();

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes dark class when toggling to light', () => {
      window.localStorage.setItem(THEME_KEY, 'dark');
      render(<ThemeShortcut />);

      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      pressShortcut();

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('respects system preference for dark class on mount', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      window.localStorage.setItem(THEME_KEY, 'system');
      render(<ThemeShortcut />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('ignored while typing', () => {
    it('does not toggle when focus is in an input', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      render(<ThemeShortcut />);

      fireEvent.keyDown(input, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      document.body.removeChild(input);
    });

    it('does not toggle when focus is in a textarea', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      render(<ThemeShortcut />);

      fireEvent.keyDown(textarea, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      document.body.removeChild(textarea);
    });

    it('does not toggle when focus is in a select', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const select = document.createElement('select');
      document.body.appendChild(select);
      select.focus();

      render(<ThemeShortcut />);

      fireEvent.keyDown(select, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      document.body.removeChild(select);
    });

    it('does not toggle when focus is in a contentEditable element', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const div = document.createElement('div');
      div.setAttribute('contentEditable', 'true');
      document.body.appendChild(div);
      div.focus();

      render(<ThemeShortcut />);

      fireEvent.keyDown(div, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      document.body.removeChild(div);
    });

    it('does not toggle when focus is inside a contentEditable child', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const outer = document.createElement('div');
      outer.setAttribute('contentEditable', 'true');
      const inner = document.createElement('span');
      outer.appendChild(inner);
      document.body.appendChild(outer);
      inner.focus();

      render(<ThemeShortcut />);

      fireEvent.keyDown(inner, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');

      document.body.removeChild(outer);
    });
  });

  describe('modifier key variations', () => {
    it('responds to Ctrl+Shift+L', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'l',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('responds to Meta+Shift+L (macOS Cmd)', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'l',
        metaKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('responds to uppercase L with Ctrl+Shift', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'L',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('dark');
    });

    it('does not trigger with only Ctrl without Shift', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'l',
        ctrlKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });

    it('does not trigger with only Shift without Ctrl/Meta', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'l',
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });

    it('does not trigger with a different key', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      render(<ThemeShortcut />);

      fireEvent.keyDown(window, {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
      });

      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });
  });

  describe('cleanup', () => {
    it('removes the event listener on unmount', () => {
      window.localStorage.setItem(THEME_KEY, 'light');
      const { unmount } = render(<ThemeShortcut />);

      unmount();

      pressShortcut();

      // Theme should not have changed because the listener was removed
      expect(window.localStorage.getItem(THEME_KEY)).toBe('light');
    });
  });

  describe('corrupted storage', () => {
    it('does not crash when localStorage.getItem throws', () => {
      const originalGetItem = window.localStorage.getItem.bind(
        window.localStorage
      );
      window.localStorage.getItem = jest.fn(() => {
        throw new Error('storage disabled');
      });

      expect(() => {
        render(<ThemeShortcut />);
      }).not.toThrow();

      window.localStorage.getItem = originalGetItem;
    });
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../ThemeToggle';

const originalLocalStorage = window.localStorage;

function replaceLocalStorage(storage: Partial<Storage>) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('ThemeToggle', () => {
  let onChange: jest.Mock;

  beforeEach(() => {
    onChange = jest.fn();
    window.localStorage.clear();
    document.documentElement.classList.remove('dark');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
    jest.restoreAllMocks();
  });

  describe('accessible structure', () => {
    it('renders a group with an accessible label', () => {
      render(<ThemeToggle />);
      const group = screen.getByRole('group', { name: 'Theme' });
      expect(group).toBeInTheDocument();
    });

    it('renders three theme buttons with correct accessible names', () => {
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'light' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'system' })
      ).toBeInTheDocument();
    });
  });

  describe('empty state (no stored value)', () => {
    it('defaults to system when nothing is stored', () => {
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });
  });

  describe('success state (stored value loaded)', () => {
    it('reads a stored dark theme from localStorage and marks it pressed', () => {
      window.localStorage.setItem('stableroute.theme', 'dark');
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('reads a stored light theme from localStorage', () => {
      window.localStorage.setItem('stableroute.theme', 'light');
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('reads a stored system theme from localStorage', () => {
      window.localStorage.setItem('stableroute.theme', 'system');
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('error / corrupted state', () => {
    it('falls back to system when localStorage.getItem throws', () => {
      replaceLocalStorage({
        getItem: jest.fn(() => {
          throw new Error('storage disabled');
        }),
      });
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('falls back to system when the stored value is invalid', () => {
      window.localStorage.setItem('stableroute.theme', 'midnight');
      render(<ThemeToggle />);
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('still updates the UI when localStorage.setItem throws', () => {
      render(<ThemeToggle />);
      replaceLocalStorage({
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(() => {
          throw new Error('quota exceeded');
        }),
      });

      fireEvent.click(screen.getByRole('button', { name: 'dark' }));
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  describe('interactions', () => {
    it('persists theme preference to localStorage', () => {
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button', { name: 'dark' }));
      expect(window.localStorage.getItem('stableroute.theme')).toBe('dark');
    });

    it('marks the selected theme as pressed', () => {
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button', { name: 'light' }));
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('updates aria-pressed when clicking a different theme', () => {
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button', { name: 'dark' }));
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );

      fireEvent.click(screen.getByRole('button', { name: 'system' }));
      expect(screen.getByRole('button', { name: 'system' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      expect(screen.getByRole('button', { name: 'dark' })).toHaveAttribute(
        'aria-pressed',
        'false'
      );
    });

    it('toggles the dark class on the document root', () => {
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button', { name: 'dark' }));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      fireEvent.click(screen.getByRole('button', { name: 'light' }));
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('resolves system theme via matchMedia for the dark class', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      render(<ThemeToggle />);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('sets the dark class based on effective theme when selecting system', () => {
      window.matchMedia = jest.fn().mockReturnValue({ matches: true });
      render(<ThemeToggle />);
      fireEvent.click(screen.getByRole('button', { name: 'system' }));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('keyboard interaction', () => {
    it('activates a theme button via keyboard Enter', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.tab();
      await user.keyboard('{Enter}');
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });

    it('activates a theme button via keyboard Space', async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.tab();
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: 'light' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });

  it('calls onChange with the selected theme', () => {
    render(<ThemeToggle onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('calls onChange for every theme selection', () => {
    render(<ThemeToggle onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'light' }));
    fireEvent.click(screen.getByRole('button', { name: 'dark' }));
    fireEvent.click(screen.getByRole('button', { name: 'system' }));
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 'light');
    expect(onChange).toHaveBeenNthCalledWith(2, 'dark');
    expect(onChange).toHaveBeenNthCalledWith(3, 'system');
  });

  it('does not crash when onChange is omitted', () => {
    expect(() => render(<ThemeToggle />)).not.toThrow();
    fireEvent.click(screen.getByRole('button', { name: 'dark' }));
    // No crash means the optional callback is handled correctly
  });
});

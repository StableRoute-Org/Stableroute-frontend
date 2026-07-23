import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CodeSample, LANGUAGE_LABELS, type Language } from '@/components/CodeSample';

const mockPush = jest.fn();

jest.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ push: mockPush }),
}));

const SAMPLES: Record<Language, string> = {
  curl: 'curl http://localhost:3001/api/v1/pairs',
  javascript: 'await fetch("http://localhost:3001/api/v1/pairs")',
};

describe('CodeSample', () => {
  beforeEach(() => {
    mockPush.mockClear();
    window.sessionStorage.clear();
  });

  describe('language selector', () => {
    it('renders both language buttons when multiple languages provided', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: 'JavaScript' })
      ).toBeInTheDocument();
    });

    it('defaults to cURL selection', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('radio', { name: 'JavaScript' })
      ).toHaveAttribute('aria-checked', 'false');
    });

    it('shows cURL code sample by default', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(screen.getByText(SAMPLES.curl)).toBeInTheDocument();
      expect(
        screen.queryByText(SAMPLES.javascript)
      ).not.toBeInTheDocument();
    });

    it('switches to JavaScript when radio is clicked', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      fireEvent.click(screen.getByRole('radio', { name: 'JavaScript' }));
      expect(
        screen.getByRole('radio', { name: 'JavaScript' })
      ).toHaveAttribute('aria-checked', 'true');
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByText(SAMPLES.javascript)).toBeInTheDocument();
      expect(
        screen.queryByText(SAMPLES.curl)
      ).not.toBeInTheDocument();
    });

    it('switches back to cURL when cURL radio is clicked', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      fireEvent.click(screen.getByRole('radio', { name: 'JavaScript' }));
      fireEvent.click(screen.getByRole('radio', { name: 'cURL' }));
      expect(screen.getByText(SAMPLES.curl)).toBeInTheDocument();
      expect(
        screen.queryByText(SAMPLES.javascript)
      ).not.toBeInTheDocument();
    });

    it('has radiogroup with accessible label', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(screen.getByRole('radiogroup', { name: 'Language' })).toBeInTheDocument();
    });
  });

  describe('single language endpoint', () => {
    it('hides language selector and shows static label', () => {
      const singleLang = { curl: 'curl http://example.com' };
      render(
        <CodeSample samples={singleLang} endpoint="GET /test" />
      );
      expect(
        screen.queryByRole('radiogroup')
      ).not.toBeInTheDocument();
      expect(screen.getByText('cURL')).toBeInTheDocument();
      expect(screen.getByText(singleLang.curl)).toBeInTheDocument();
    });

    it('shows JavaScript label for JS-only sample', () => {
      const singleLang = { javascript: 'fetch("/api")' } as Record<Language, string>;
      render(
        <CodeSample samples={singleLang} endpoint="GET /test" />
      );
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
    });
  });

  describe('session persistence', () => {
    it('reads stored language on mount', () => {
      window.sessionStorage.setItem(
        'stableroute.docs.lang',
        'javascript'
      );
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'JavaScript' })
      ).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText(SAMPLES.javascript)).toBeInTheDocument();
    });

    it('falls back to cURL for invalid stored value', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', 'python');
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toHaveAttribute('aria-checked', 'true');
    });

    it('falls back to cURL when storage throws', () => {
      const originalGetItem = window.sessionStorage.getItem;
      window.sessionStorage.getItem = jest.fn(() => {
        throw new Error('private mode');
      });
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toHaveAttribute('aria-checked', 'true');
      window.sessionStorage.getItem = originalGetItem;
    });

    it('persists language choice to sessionStorage', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      fireEvent.click(screen.getByRole('radio', { name: 'JavaScript' }));
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBe(
        'javascript'
      );
    });

    it('persists choice when switching back', () => {
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      fireEvent.click(screen.getByRole('radio', { name: 'JavaScript' }));
      fireEvent.click(screen.getByRole('radio', { name: 'cURL' }));
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBe(
        'curl'
      );
    });

    it('does not persist for single-language endpoints', () => {
      const singleLang = { curl: 'curl http://example.com' };
      render(
        <CodeSample samples={singleLang} endpoint="GET /test" />
      );
      expect(window.sessionStorage.getItem('stableroute.docs.lang')).toBeNull();
    });
  });

  describe('copy to clipboard', () => {
    function enableClipboard(writeText: jest.Mock) {
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: true,
      });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      });
    }

    let originalClipboard: Clipboard;
    let originalSecureContext: boolean;

    beforeEach(() => {
      originalClipboard = navigator.clipboard;
      originalSecureContext = window.isSecureContext;
    });

    afterEach(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
      Object.defineProperty(window, 'isSecureContext', {
        configurable: true,
        value: originalSecureContext,
      });
    });

    it('copies the active language code and shows toast', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      enableClipboard(writeText);
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);

      fireEvent.click(
        screen.getByRole('button', { name: /Copy cURL code/ })
      );

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(SAMPLES.curl);
        expect(mockPush).toHaveBeenCalledWith('Copied cURL snippet.');
      });
    });

    it('copies the correct language when switched', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      enableClipboard(writeText);
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);

      fireEvent.click(screen.getByRole('radio', { name: 'JavaScript' }));
      fireEvent.click(
        screen.getByRole('button', { name: /Copy JavaScript code/ })
      );

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(SAMPLES.javascript);
        expect(mockPush).toHaveBeenCalledWith(
          'Copied JavaScript snippet.'
        );
      });
    });

    it('shows error toast when clipboard write fails', async () => {
      enableClipboard(jest.fn().mockRejectedValue(new Error('denied')));
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);

      fireEvent.click(
        screen.getByRole('button', { name: /Copy cURL code/ })
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          'Could not copy to clipboard.',
          'error'
        );
      });
    });

    it('disables copy button while copying', async () => {
      let resolveWrite!: () => void;
      const writeText = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveWrite = resolve;
          })
      );
      enableClipboard(writeText);
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);

      const copyBtn = screen.getByRole('button', {
        name: /Copy cURL code/,
      });
      fireEvent.click(copyBtn);
      expect(copyBtn).toBeDisabled();

      resolveWrite();
      await waitFor(() => expect(copyBtn).not.toBeDisabled());
    });
  });

  describe('edge cases', () => {
    it('falls back to first available language for unknown stored value', () => {
      window.sessionStorage.setItem('stableroute.docs.lang', 'python');
      render(<CodeSample samples={SAMPLES} endpoint="GET /pairs" />);
      expect(
        screen.getByRole('radio', { name: 'cURL' })
      ).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('LANGUAGE_LABELS', () => {
    it('has labels for all supported languages', () => {
      expect(LANGUAGE_LABELS.curl).toBe('cURL');
      expect(LANGUAGE_LABELS.javascript).toBe('JavaScript');
    });
  });
});

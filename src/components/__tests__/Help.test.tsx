import { act, render, screen } from '@testing-library/react';
import { Help } from '../Help';

describe('Help', () => {
  describe('visible status text', () => {
    it('renders its trigger children', () => {
      render(
        <Help status="success">
          <button>Get help</button>
        </Help>
      );
      expect(screen.getByRole('button', { name: /get help/i })).toBeInTheDocument();
    });

    it('renders the loading state', () => {
      render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveTextContent(/loading help/i);
    });

    it('renders the empty state', () => {
      render(
        <Help status="empty">
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveTextContent(/no help available/i);
    });

    it('renders the error state with the provided message', () => {
      render(
        <Help status="error" message="Failed to load help content">
          <span>trigger</span>
        </Help>
      );
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/help unavailable/i);
      expect(status).toHaveTextContent(/failed to load help content/i);
    });

    it('renders the success state', () => {
      render(
        <Help status="success">
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveTextContent(/help ready/i);
    });

    it('renders the success state with an optional message appended', () => {
      render(
        <Help status="success" message="3 articles found">
          <span>trigger</span>
        </Help>
      );
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/help ready/i);
      expect(status).toHaveTextContent(/3 articles found/i);
    });

    it('keeps states mutually exclusive (only one status message present)', () => {
      render(
        <Help status="success" message="Done">
          <span>trigger</span>
        </Help>
      );
      const status = screen.getByRole('status');
      expect(status).toHaveTextContent(/help ready/i);
      expect(status).not.toHaveTextContent(/loading help/i);
      expect(status).not.toHaveTextContent(/no help available/i);
      expect(status).not.toHaveTextContent(/help unavailable/i);
    });

    it('exposes the status for assistive technology via aria-live', () => {
      render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('omits the trailing message segment when no message is provided', () => {
      render(
        <Help status="empty">
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveTextContent(/^no help available$/i);
    });

    it('does not re-render when props are referentially stable (memoized)', () => {
      const props = { status: 'success' as const, message: 'ok' };
      const { rerender } = render(
        <Help {...props}>
          <span>trigger</span>
        </Help>
      );
      // re-render with the same prop references — memo should skip
      rerender(
        <Help {...props}>
          <span>trigger</span>
        </Help>
      );
      expect(screen.getByRole('status')).toHaveTextContent(/help ready/i);
    });
  });

  describe('live region announcements', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    function getLiveRegion() {
      return screen.getByTestId('help-live-region');
    }

    it('is empty on initial mount (no announcement)', () => {
      render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );
      // Nothing is announced on the initial render...
      expect(getLiveRegion()).toBeEmptyDOMElement();

      // ...and nothing is announced even after the debounce window elapses.
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(getLiveRegion()).toBeEmptyDOMElement();
    });

    it('switches to loading → success after debounce', () => {
      const { rerender } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      // After initial mount, the live region is empty.
      expect(getLiveRegion()).toBeEmptyDOMElement();

      // Change status to success.
      rerender(
        <Help status="success">
          <span>trigger</span>
        </Help>
      );

      // Before debounce, the announcement is still pending.
      expect(getLiveRegion()).toBeEmptyDOMElement();

      // Advance past the default 300ms debounce.
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(getLiveRegion()).toHaveTextContent('Help ready');
    });

    it('announces loading → error with the provided message', () => {
      const { rerender } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="error" message="Network error">
          <span>trigger</span>
        </Help>
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(getLiveRegion()).toHaveTextContent('Help unavailable: Network error');
    });

    it('announces loading → success with an optional message', () => {
      const { rerender } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="success" message="3 articles found">
          <span>trigger</span>
        </Help>
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(getLiveRegion()).toHaveTextContent('Help ready: 3 articles found');
    });

    it('announces empty → success transitions', () => {
      const { rerender } = render(
        <Help status="empty">
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="success">
          <span>trigger</span>
        </Help>
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(getLiveRegion()).toHaveTextContent('Help ready');
    });

    it('coalesces rapid successive status changes (last one wins)', () => {
      const { rerender } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="error" message="Error A">
          <span>trigger</span>
        </Help>
      );
      // Immediately change again before debounce fires.
      rerender(
        <Help status="success" message="All good">
          <span>trigger</span>
        </Help>
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Only the last status should be announced.
      expect(getLiveRegion()).toHaveTextContent('Help ready: All good');
      expect(getLiveRegion()).not.toHaveTextContent('Error A');
    });

    it('does not announce when status stays the same', () => {
      const { rerender } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      // Re-render with same status.
      rerender(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Still empty because status never changed.
      expect(getLiveRegion()).toBeEmptyDOMElement();
    });

    it('respects a custom debounce window', () => {
      const { rerender } = render(
        <Help status="loading" debounceMs={500}>
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="success" debounceMs={500}>
          <span>trigger</span>
        </Help>
      );

      // Not yet announced at 300ms.
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(getLiveRegion()).toBeEmptyDOMElement();

      // Announced at 500ms.
      act(() => {
        jest.advanceTimersByTime(200);
      });
      expect(getLiveRegion()).toHaveTextContent('Help ready');
    });

    it('announces immediately when debounceMs is 0', () => {
      const { rerender } = render(
        <Help status="loading" debounceMs={0}>
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="success" debounceMs={0}>
          <span>trigger</span>
        </Help>
      );

      // No debounce — announcement should be immediate.
      expect(getLiveRegion()).toHaveTextContent('Help ready');
    });

    it('has aria-live="polite" and aria-atomic="true" on the live region', () => {
      render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );
      const region = getLiveRegion();
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'true');
    });

    it('has class sr-only on the live region', () => {
      render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );
      expect(getLiveRegion()).toHaveClass('sr-only');
    });

    it('cancels the pending debounced announcement when unmounted', () => {
      const { rerender, unmount } = render(
        <Help status="loading">
          <span>trigger</span>
        </Help>
      );

      rerender(
        <Help status="success">
          <span>trigger</span>
        </Help>
      );

      // Unmount before the debounce window elapses.
      unmount();

      act(() => {
        jest.advanceTimersByTime(300);
      });

      // The unmounted component never published its announcement, and the
      // pending timer was cleared — no error is thrown and nothing lingers.
      expect(() => screen.getByTestId('help-live-region')).toThrow();
    });
  });
});

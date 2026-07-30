import { act, renderHook } from '@testing-library/react';
import { useFormAnnouncement } from '../useFormAnnouncement';

describe('useFormAnnouncement', () => {
  describe('without debounce (default)', () => {
    it('returns an empty message on initial render (no mount announcement)', () => {
      const { result } = renderHook(() => useFormAnnouncement());
      expect(result.current.message).toBe('');
    });

    it('updates the message immediately when announce is called', () => {
      const { result } = renderHook(() => useFormAnnouncement());

      act(() => {
        result.current.announce('Submitting form…');
      });

      expect(result.current.message).toBe('Submitting form…');
    });

    it('clears a previous message when announce is called with an empty string', () => {
      const { result } = renderHook(() => useFormAnnouncement());

      act(() => {
        result.current.announce('Registering…');
      });
      expect(result.current.message).toBe('Registering…');

      act(() => {
        result.current.announce('');
      });
      expect(result.current.message).toBe('');
    });

    it('replaces previous message with the latest announce call', () => {
      const { result } = renderHook(() => useFormAnnouncement());

      act(() => {
        result.current.announce('First message');
      });
      expect(result.current.message).toBe('First message');

      act(() => {
        result.current.announce('Second message');
      });
      expect(result.current.message).toBe('Second message');
    });

    it('handles rapid successive updates (last one wins)', () => {
      const { result } = renderHook(() => useFormAnnouncement());

      act(() => {
        result.current.announce('A');
        result.current.announce('B');
        result.current.announce('C');
      });

      expect(result.current.message).toBe('C');
    });

    it('does not throw when announce is called many times', () => {
      const { result } = renderHook(() => useFormAnnouncement());

      expect(() => {
        act(() => {
          for (let i = 0; i < 100; i++) {
            result.current.announce(`Message ${i}`);
          }
        });
      }).not.toThrow();

      expect(result.current.message).toBe('Message 99');
    });

    it('returns a stable announce function reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useFormAnnouncement());
      const firstAnnounce = result.current.announce;

      rerender();
      expect(result.current.announce).toBe(firstAnnounce);
    });
  });

  describe('with debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('does not update the message until the debounce window elapses', () => {
      const { result } = renderHook(() => useFormAnnouncement(150));

      act(() => {
        result.current.announce('Debounced message');
      });

      expect(result.current.message).toBe('');

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.message).toBe('Debounced message');
    });

    it('coalesces rapid successive calls (last one wins)', () => {
      const { result } = renderHook(() => useFormAnnouncement(150));

      act(() => {
        result.current.announce('A');
        result.current.announce('B');
        result.current.announce('C');
      });

      expect(result.current.message).toBe('');

      act(() => {
        jest.advanceTimersByTime(150);
      });

      expect(result.current.message).toBe('C');
    });

    it('cancels a pending debounce when a new announce call arrives', () => {
      const { result } = renderHook(() => useFormAnnouncement(150));

      act(() => {
        result.current.announce('Message A');
      });

      // Advance partway through the debounce
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // New call resets the timer
      act(() => {
        result.current.announce('Message B');
      });

      // Advance past the original timer but not the new one
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current.message).toBe('');

      // Advance past the new timer
      act(() => {
        jest.advanceTimersByTime(100);
      });
      expect(result.current.message).toBe('Message B');
    });
  });
});

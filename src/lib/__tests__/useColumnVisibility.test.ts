import { act, renderHook, waitFor } from '@testing-library/react';
import { useColumnVisibility } from '../useColumnVisibility';
import { DEFAULT_COLUMN_VISIBILITY, STORAGE_KEY } from '../columnVisibility';

afterEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('useColumnVisibility', () => {
  it('returns all columns visible by default', async () => {
    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual(DEFAULT_COLUMN_VISIBILITY);
    });
  });

  it('restores a valid stored visibility on mount', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: false, destination: true, actions: true })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual({
        source: false,
        destination: true,
        actions: true,
      });
    });
  });

  it('falls back to defaults for corrupt stored data', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'not-valid-json{{');

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual(DEFAULT_COLUMN_VISIBILITY);
    });
  });

  it('falls back to defaults for stored data with unknown keys', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: true, bogus: false })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual(DEFAULT_COLUMN_VISIBILITY);
    });
  });

  it('falls back to defaults for stored data with non-boolean values', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: 'yes', destination: true, actions: true })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual(DEFAULT_COLUMN_VISIBILITY);
    });
  });

  it('persists a toggle to localStorage', async () => {
    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility.source).toBe(true);
    });

    act(() => {
      result.current.toggle('source');
    });

    expect(result.current.visibility.source).toBe(false);
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) as string
    );
    expect(stored.source).toBe(false);
  });

  it('refuses to hide the last visible column', async () => {
    // Start with only actions visible.
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: false, destination: false, actions: true })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility).toEqual({
        source: false,
        destination: false,
        actions: true,
      });
    });

    act(() => {
      result.current.toggle('actions');
    });

    // Should still be true – the last visible column cannot be hidden.
    expect(result.current.visibility.actions).toBe(true);
  });

  it('isColumnVisible reflects the current visibility', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: true, destination: false, actions: true })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.isColumnVisible('source')).toBe(true);
      expect(result.current.isColumnVisible('destination')).toBe(false);
      expect(result.current.isColumnVisible('actions')).toBe(true);
    });
  });

  it('toggle updates isColumnVisible reactively', async () => {
    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.isColumnVisible('destination')).toBe(true);
    });

    act(() => {
      result.current.toggle('destination');
    });

    expect(result.current.isColumnVisible('destination')).toBe(false);

    act(() => {
      result.current.toggle('destination');
    });

    expect(result.current.isColumnVisible('destination')).toBe(true);
  });

  it('forces source visible when stored data hides all columns', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ source: false, destination: false, actions: false })
    );

    const { result } = renderHook(() => useColumnVisibility());
    await waitFor(() => {
      expect(result.current.visibility.source).toBe(true);
      expect(result.current.visibility.destination).toBe(false);
      expect(result.current.visibility.actions).toBe(false);
    });
  });
});

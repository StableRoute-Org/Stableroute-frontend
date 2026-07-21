import { act, renderHook, waitFor } from '@testing-library/react';
import {
  rawStringSerializer,
  readLocalStorageValue,
  useLocalStorage,
  writeLocalStorageValue,
} from '../useLocalStorage';

const originalLocalStorage = window.localStorage;

function replaceLocalStorage(storage: Partial<Storage>) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

afterEach(() => {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: originalLocalStorage,
  });
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('readLocalStorageValue', () => {
  it('returns the default when the key is absent', () => {
    expect(readLocalStorageValue('missing', 'fallback')).toBe('fallback');
  });

  it('round-trips a JSON value written directly to storage', () => {
    window.localStorage.setItem('k', JSON.stringify({ a: 1 }));
    expect(readLocalStorageValue('k', null as unknown)).toEqual({ a: 1 });
  });

  it('falls back to the default on malformed JSON', () => {
    window.localStorage.setItem('k', '{not valid json');
    expect(readLocalStorageValue('k', 'fallback')).toBe('fallback');
  });

  it('falls back to the default when validate rejects the parsed value', () => {
    window.localStorage.setItem('k', JSON.stringify(42));
    const isString = (v: unknown): v is string => typeof v === 'string';
    expect(readLocalStorageValue<string>('k', 'fallback', isString)).toBe(
      'fallback'
    );
  });

  it('returns the parsed value when validate accepts it', () => {
    window.localStorage.setItem('k', JSON.stringify('hello'));
    const isString = (v: unknown): v is string => typeof v === 'string';
    expect(readLocalStorageValue<string>('k', 'fallback', isString)).toBe(
      'hello'
    );
  });

  it('falls back to the default when localStorage.getItem throws', () => {
    replaceLocalStorage({
      getItem: jest.fn(() => {
        throw new Error('storage disabled');
      }),
    });
    expect(readLocalStorageValue('k', 'fallback')).toBe('fallback');
  });

  it('returns the default when running without a window (SSR)', () => {
    const win = global.window;
    // @ts-expect-error -- simulating a server environment for this call
    delete global.window;
    try {
      expect(readLocalStorageValue('k', 'fallback')).toBe('fallback');
    } finally {
      global.window = win;
    }
  });

  it('supports a raw string serializer that skips JSON parsing', () => {
    window.localStorage.setItem('k', 'dark');
    expect(
      readLocalStorageValue('k', 'system', undefined, rawStringSerializer)
    ).toBe('dark');
  });
});

describe('writeLocalStorageValue', () => {
  it('writes a JSON-serialized value and returns true', () => {
    expect(writeLocalStorageValue('k', { a: 1 })).toBe(true);
    expect(window.localStorage.getItem('k')).toBe(JSON.stringify({ a: 1 }));
  });

  it('returns false and does not throw on a generic write failure', () => {
    const setItem = jest.fn(() => {
      throw new Error('storage disabled');
    });
    replaceLocalStorage({ setItem });
    expect(() => writeLocalStorageValue('k', 'v')).not.toThrow();
    expect(writeLocalStorageValue('k', 'v')).toBe(false);
  });

  it('returns false and does not throw on a quota-exceeded DOMException', () => {
    const setItem = jest.fn(() => {
      throw new DOMException(
        'The quota has been exceeded.',
        'QuotaExceededError'
      );
    });
    replaceLocalStorage({ setItem });
    expect(() => writeLocalStorageValue('k', 'v')).not.toThrow();
    expect(writeLocalStorageValue('k', 'v')).toBe(false);
  });

  it('returns false when running without a window (SSR)', () => {
    const win = global.window;
    // @ts-expect-error -- simulating a server environment for this call
    delete global.window;
    try {
      expect(writeLocalStorageValue('k', 'v')).toBe(false);
    } finally {
      global.window = win;
    }
  });

  it('writes a raw string via rawStringSerializer without JSON quoting', () => {
    writeLocalStorageValue('k', 'dark', rawStringSerializer);
    expect(window.localStorage.getItem('k')).toBe('dark');
  });
});

describe('useLocalStorage', () => {
  it('renders the default value before the sync effect runs, then syncs from storage', async () => {
    window.localStorage.setItem('k', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('k', 'default'));

    await waitFor(() => expect(result.current[0]).toBe('stored'));
  });

  it('keeps the default when nothing is stored', async () => {
    const { result } = renderHook(() => useLocalStorage('missing', 'default'));
    await waitFor(() => expect(result.current[0]).toBe('default'));
  });

  it('updates state and persists on set', async () => {
    const { result } = renderHook(() => useLocalStorage('k', 'default'));
    await waitFor(() => expect(result.current[0]).toBe('default'));

    act(() => {
      result.current[1]('next');
    });

    expect(result.current[0]).toBe('next');
    expect(window.localStorage.getItem('k')).toBe(JSON.stringify('next'));
  });

  it('supports the functional updater form', async () => {
    window.localStorage.setItem('k', JSON.stringify(1));
    const { result } = renderHook(() => useLocalStorage('k', 0));
    await waitFor(() => expect(result.current[0]).toBe(1));

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
    expect(window.localStorage.getItem('k')).toBe(JSON.stringify(2));
  });

  it('still updates in-memory state when persistence fails (quota exceeded)', async () => {
    const { result } = renderHook(() => useLocalStorage('k', 'default'));
    await waitFor(() => expect(result.current[0]).toBe('default'));

    replaceLocalStorage({
      getItem: originalLocalStorage.getItem.bind(originalLocalStorage),
      setItem: jest.fn(() => {
        throw new DOMException(
          'The quota has been exceeded.',
          'QuotaExceededError'
        );
      }),
    });

    act(() => {
      result.current[1]('next');
    });

    expect(result.current[0]).toBe('next');
  });

  it('rejects a stored value that fails validate and keeps the default', async () => {
    window.localStorage.setItem('k', JSON.stringify(123));
    const isString = (v: unknown): v is string => typeof v === 'string';
    const { result } = renderHook(() =>
      useLocalStorage<string>('k', 'default', isString)
    );

    await waitFor(() => expect(result.current[0]).toBe('default'));
  });

  it('round-trips through the raw string serializer without JSON quoting', async () => {
    window.localStorage.setItem('k', 'dark');
    const { result } = renderHook(() =>
      useLocalStorage<string>('k', 'system', undefined, rawStringSerializer)
    );
    await waitFor(() => expect(result.current[0]).toBe('dark'));

    act(() => {
      result.current[1]('light');
    });

    expect(window.localStorage.getItem('k')).toBe('light');
  });
});

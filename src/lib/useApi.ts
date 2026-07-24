'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet } from './apiClient';

type FetchSnapshot<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'success'; data: T };

type Refetch = () => void | Promise<void>;

/** A fetch lifecycle whose status determines which values are available. */
export type FetchState<
  T,
  TRefetch extends Refetch = () => void,
> = FetchSnapshot<T> & {
  refetch: TRefetch;
};

export type UseApiResult<T> = FetchState<T>;

export function useApi<T>(
  path: string | null,
  validate?: (v: unknown) => v is T
): UseApiResult<T> {
  const [state, setState] = useState<FetchSnapshot<T>>(
    path === null ? { status: 'idle' } : { status: 'loading' }
  );
  const [reloadKey, setReloadKey] = useState(0);
  const validateRef = useRef(validate);
  validateRef.current = validate;

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (path === null) {
      setState({ status: 'idle' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    apiGet<T>(path, { validate: validateRef.current })
      .then((data) => !cancelled && setState({ status: 'success', data }))
      .catch(
        (e) =>
          !cancelled &&
          setState({
            status: 'error',
            error: (e as Error).message ?? 'failed to load',
          })
      );
    return () => {
      cancelled = true;
    };
  }, [path, reloadKey]);

  return { ...state, refetch };
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { FetchState } from './useApi';

export type UseListResult<T> = FetchState<T[], () => Promise<void>>;

/** Shared load/refetch list pattern for dashboard CRUD pages. */
export function useList<T>(loader: () => Promise<T[]>): UseListResult<T> {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'success'; data: T[] }
    | { status: 'error'; error: string }
  >({ status: 'loading' });
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const refetch = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState({ status: 'loading' });
    try {
      const data = await loader();
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState({ status: 'success', data });
      }
    } catch (err) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState({
          status: 'error',
          error: (err as Error).message ?? 'failed to load',
        });
      }
    }
  }, [loader]);

  useEffect(() => {
    mountedRef.current = true;
    void refetch();
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [refetch]);

  return { ...state, refetch };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseListResult<T> = {
  items: T[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

/** Shared load/reload list pattern for dashboard CRUD pages. */
export function useList<T>(loader: () => Promise<T[]>): UseListResult<T> {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  const reload = useCallback(async () => {
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    try {
      const next = await loader();
      if (!cancelledRef.current) setItems(next);
    } catch (err) {
      if (!cancelledRef.current) setError((err as Error).message);
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
    return () => {
      cancelledRef.current = true;
    };
  }, [reload]);

  return { items, error, loading, reload };
}

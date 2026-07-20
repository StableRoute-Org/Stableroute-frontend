"use client";

import { useCallback, useEffect, useState } from "react";

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

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loader();
      setItems(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items, error, loading, reload };
}

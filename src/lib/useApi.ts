"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./apiClient";

type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };

export type UseApiResult<T> = State<T> & { refetch: () => void };

export function useApi<T>(path: string | null): UseApiResult<T> {
  const [state, setState] = useState<State<T>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  const refetch = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (path === null) return;
    let cancelled = false;
    setState({ status: "loading" });
    apiGet<T>(path)
      .then((data) => !cancelled && setState({ status: "ok", data }))
      .catch(
        (e) =>
          !cancelled &&
          setState({
            status: "error",
            error: (e as Error).message ?? "failed to load",
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [path, reloadKey]);

  return { ...state, refetch };
}

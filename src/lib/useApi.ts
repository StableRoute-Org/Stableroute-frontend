"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "./apiClient";

type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };

// Flatten the discriminated union so consumers can destructure
// `status`, `data`, and `error` from the result without TypeScript
// losing track of which fields are present on the current variant.
// Callers still narrow on `status` before reading the data-specific
// fields, but the type now exposes all three so a single-line
// `const { status, data, error } = useApi(...)` type-checks.
export type UseApiResult<T> = {
  status: State<T>["status"];
  data: T | null;
  error: string | null;
  refetch: () => void;
};

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

  if (state.status === "ok") {
    return { status: "ok", data: state.data, error: null, refetch };
  }
  if (state.status === "error") {
    return { status: "error", data: null, error: state.error, refetch };
  }
  return { status: "loading", data: null, error: null, refetch };
}

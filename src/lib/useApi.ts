"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./apiClient";

type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };

export function useApi<T>(path: string | null): State<T> {
  const [state, setState] = useState<State<T>>({ status: "loading" });

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
          })
      );
    return () => {
      cancelled = true;
    };
  }, [path]);

  return state;
}

"use client";

import { useEffect } from "react";
import { registerAuthErrorHandler } from "@/lib/apiClient";
import { useToast } from "@/components/ToastProvider";

export function ApiAuthGuard() {
  const { push } = useToast();

  useEffect(() => {
    const unregister = registerAuthErrorHandler((status) => {
      const message =
        status === 403
          ? "You don't have permission to perform that action."
          : "Your session has expired. Please sign in again.";
      push(message, "error");
    });
    return unregister;
  }, [push]);

  return null;
}

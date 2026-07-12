"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastLevel = "info" | "error";

export type ToastPushOptions = {
  /** Auto-dismiss delay in ms. Ignored when `sticky` is true. Default 4000. */
  durationMs?: number;
  /** When true, the toast stays until manually dismissed. */
  sticky?: boolean;
};

type Toast = { id: string; message: string; level: ToastLevel };

type Ctx = {
  push: (message: string, level?: ToastLevel, options?: ToastPushOptions) => void;
};

const DEFAULT_DURATION_MS = 4000;
const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      setItems((current) => current.filter((toast) => toast.id !== id));
    },
    [clearTimer],
  );

  /**
   * Enqueue a toast. Pass `sticky: true` or `durationMs` to control auto-dismiss.
   */
  const push = useCallback(
    (message: string, level: ToastLevel = "info", options?: ToastPushOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setItems((current) => [...current, { id, message, level }]);

      if (!options?.sticky) {
        const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS;
        const timer = setTimeout(() => dismiss(id), durationMs);
        timersRef.current.set(id, timer);
      }
    },
    [dismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2"
      >
        {items.map((toast) => (
          <div
            key={toast.id}
            role={toast.level === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex items-start gap-2 rounded-md px-4 py-2 text-sm shadow-lg ${
              toast.level === "error"
                ? "bg-rose-600 text-white"
                : "bg-black text-white dark:bg-white dark:text-black"
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded px-1 text-xs opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

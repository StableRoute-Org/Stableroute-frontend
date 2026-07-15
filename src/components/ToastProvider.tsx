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

type Toast = {
  id: string;
  message: string;
  level: "info" | "error";
  count: number;
};
type Ctx = { push: (m: string, level?: Toast["level"]) => void };

const ToastCtx = createContext<Ctx | null>(null);
const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const scheduleDismiss = useCallback(
    (id: string) => {
      clearTimer(id);
      const timer = setTimeout(() => {
        timers.current.delete(id);
        setItems((s) => s.filter((t) => t.id !== id));
      }, AUTO_DISMISS_MS);
      timers.current.set(id, timer);
    },
    [clearTimer]
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  const push = useCallback(
    (message: string, level: Toast["level"] = "info") => {
      setItems((current) => {
        const duplicate = current.find(
          (toast) => toast.message === message && toast.level === level
        );
        if (duplicate) {
          scheduleDismiss(duplicate.id);
          return current.map((toast) =>
            toast.id === duplicate.id
              ? { ...toast, count: toast.count + 1 }
              : toast
          );
        }

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        scheduleDismiss(id);
        const next = [...current, { id, message, level, count: 1 }];
        const dropped = next.splice(0, Math.max(0, next.length - MAX_VISIBLE_TOASTS));
        dropped.forEach((toast) => clearTimer(toast.id));
        return next;
      });
    },
    [clearTimer, scheduleDismiss]
  );

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 flex flex-col gap-2"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.level === "error" ? "alert" : "status"}
            className={`pointer-events-auto rounded-md px-4 py-2 text-sm shadow-lg ${
              t.level === "error"
                ? "bg-rose-600 text-white"
                : "bg-black text-white dark:bg-white dark:text-black"
            }`}
          >
            <span>{t.message}</span>
            {t.count > 1 && (
              <span
                aria-label={`${t.count} duplicate notifications`}
                className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold"
              >
                x{t.count}
              </span>
            )}
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

import { type ReactNode } from "react";

type Variant = "neutral" | "ok" | "warning" | "danger";

// Semantic color tokens mapped to the tailwind.config.ts theme extension
const variants: Record<Variant, string> = {
  neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  ok: "bg-success-100 text-success-800 dark:bg-success-950 dark:text-success-300",
  warning: "bg-warning-100 text-warning-800 dark:bg-warning-950 dark:text-warning-300",
  danger: "bg-danger-100 text-danger-800 dark:bg-danger-950 dark:text-danger-300",
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

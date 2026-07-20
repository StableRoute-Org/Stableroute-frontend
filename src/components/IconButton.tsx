import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

/** Icon-only control with a required accessible name. */
export function IconButton({ label, children, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-sm hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

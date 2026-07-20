import {
  cloneElement,
  isValidElement,
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
  secondary:
    "border border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** When true, merge styles onto the single child element (e.g. next/link). */
  asChild?: boolean;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  className = "",
  asChild = false,
  children,
  ...rest
}: ButtonProps) {
  const classes = `rounded-full px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${ring} ${className}`;

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...rest,
      className: `${classes} ${child.props.className ?? ""}`.trim(),
    });
  }

  return (
    <button {...rest} className={classes}>
      {children}
    </button>
  );
}

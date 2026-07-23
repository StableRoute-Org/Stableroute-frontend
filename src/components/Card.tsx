import { type HTMLAttributes, type ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  footer?: ReactNode;
};

export function Card({ title, footer, children, className = "", ...rest }: CardProps) {
  return (
    <section
      className={`rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 ${className}`}
      {...rest}
    >
      {title && <header className="mb-2 font-medium">{title}</header>}
      <div>{children}</div>
      {footer && (
        <footer className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800">
          {footer}
        </footer>
      )}
    </section>
  );
}

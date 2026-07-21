import { type HTMLAttributes, type ReactNode } from "react";

// Omit the DOM `title` (a string tooltip attribute) so our richer ReactNode
// title isn't narrowed to string by the intersection.
type CardProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: ReactNode;
  footer?: ReactNode;
};

/**
 * Card — surface container with an optional title and footer.
 *
 * Forced-colors note: `data-card` and `data-card-footer` are hooked by the
 * `@media (forced-colors: active)` block in globals.css to re-assert borders
 * that would otherwise be dropped in Windows High Contrast mode.
 */
export function Card({ title, footer, children, className = "", ...rest }: CardProps) {
  return (
    <section
      data-card
      className={`rounded-lg border border-neutral-200 p-4 dark:border-neutral-800 ${className}`}
      {...rest}
    >
      {title && <header className="mb-2 font-medium">{title}</header>}
      <div>{children}</div>
      {footer && (
        <footer
          data-card-footer
          className="mt-3 border-t border-neutral-100 pt-3 text-xs text-neutral-500 dark:border-neutral-800"
        >
          {footer}
        </footer>
      )}
    </section>
  );
}

import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Tooltip } from './Tooltip';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  /**
   * Optional tooltip text shown on hover/focus.
   * When set, the button is wrapped in a {@link Tooltip} describing the
   * action, which is accessible to keyboard and screen-reader users via
   * `aria-describedby`.
   */
  tooltip?: string;
};

/** Icon-only control with a required accessible name. */
export function IconButton({
  label,
  children,
  className = '',
  tooltip,
  ...rest
}: Props) {
  const button = (
    <button
      type="button"
      aria-label={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-sm hover:border-neutral-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)] dark:border-neutral-700 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}

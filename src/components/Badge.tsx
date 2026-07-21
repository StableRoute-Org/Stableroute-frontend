import { type ReactNode } from 'react';

type Variant = 'neutral' | 'ok' | 'warning' | 'danger';

const variants: Record<Variant, string> = {
  neutral:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  danger: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
};

/**
 * Forced-colors status icons.
 *
 * In Windows High Contrast mode colour alone cannot convey status, so we
 * prepend a short, visually hidden-in-normal-mode text symbol that remains
 * visible when the browser strips backgrounds.  The span uses
 * `aria-hidden="true"` because the variant meaning is already communicated
 * through the badge label text by the consuming page.
 */
const forcedColorsIcons: Record<Variant, string> = {
  neutral: '',
  ok: '✓ ',
  warning: '⚠ ',
  danger: '✕ ',
};

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  const icon = forcedColorsIcons[variant];

  return (
    <span
      data-badge
      data-variant={variant}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="mr-0.5 hidden [forced-colors:active]:inline"
        >
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

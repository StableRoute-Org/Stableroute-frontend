'use client';

import {
  cloneElement,
  isValidElement,
  useRef,
  useState,
  useId,
  type ReactElement,
  type ReactNode,
  type HTMLAttributes,
} from 'react';

type Props = {
  /** Text content shown inside the tooltip popup. */
  content: string;
  /** The trigger element the tooltip describes. Must be a single React element. */
  children: ReactElement<HTMLAttributes<HTMLElement>>;
  /** Delay in milliseconds before the tooltip appears (default 500). */
  delay?: number;
};

/**
 * Tooltip — accessible popup that describes a UI control.
 *
 * - Shows on hover (mouseenter) and focus.
 * - Hides on mouseleave, blur, and Escape keydown.
 * - Wires the trigger to the popup via `aria-describedby` on the child
 *   element directly so screen readers associate it with the interactive
 *   control.
 * - Renders the popup with `role="tooltip"`.
 * - The global `prefers-reduced-motion` media query in globals.css
 *   collapses the opacity transition to ~0ms automatically.
 */
export function Tooltip({ content, children, delay = 500 }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const show = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        onMouseEnter: show,
        onMouseLeave: hide,
        onFocus: show,
        onBlur: hide,
        onKeyDown: (
          e: React.KeyboardEvent<HTMLElement>
        ) => {
          if (e.key === 'Escape') hide();
          children.props.onKeyDown?.(e);
        },
        'aria-describedby': visible ? id : undefined,
      })
    : children;

  return (
    <span className="relative inline-flex">
      {trigger}
      {visible && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-sm transition-opacity duration-150 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {content}
        </span>
      )}
    </span>
  );
}

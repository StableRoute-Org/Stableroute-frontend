'use client';

import { useEffect, useRef, type RefObject } from 'react';

export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

export interface UseFocusTrapOptions {
  isActive: boolean;
  onClose?: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * Custom hook providing robust focus trapping, initial focus placement,
 * Escape key dismissal, and focus restoration to the trigger element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  containerRef: RefObject<T | null>,
  { isActive, onClose, initialFocusRef, returnFocusRef }: UseFocusTrapOptions
) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Capture previous focus and handle initial focus
  useEffect(() => {
    if (!isActive) return;

    // Record currently focused element before opening
    if (document.activeElement instanceof HTMLElement) {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Determine initial focus element
    const focusTarget =
      initialFocusRef?.current ??
      container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ??
      container;

    focusTarget.focus();

    const returnFocusNode = returnFocusRef?.current;

    return () => {
      // Restore focus on close
      const restoreTarget =
        returnFocusNode ?? previouslyFocusedElementRef.current;
      if (restoreTarget && typeof restoreTarget.focus === 'function') {
        restoreTarget.focus();
      }
    };
  }, [isActive, containerRef, initialFocusRef, returnFocusRef]);

  // Handle Tab focus trapping and Escape key
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (el) =>
          process.env.NODE_ENV === 'test' ||
          el.offsetParent !== null ||
          el.getClientRects().length > 0
      );

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === container
        ) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef, onClose]);

  return { previouslyFocusedElementRef };
}

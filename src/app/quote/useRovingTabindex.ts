'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';

export interface UseRovingTabindexOptions {
  /** Number of navigable items in the list. */
  itemCount: number;
  /** Optional initially active index (default 0). */
  initialIndex?: number;
  /** Optional callback invoked on Enter or Space keydown. */
  onActivate?: (index: number) => void;
  /** Whether navigation wraps around at start/end boundaries (default false). */
  loop?: boolean;
}

export interface ItemRovingProps {
  tabIndex: 0 | -1;
  ref: (el: HTMLElement | null) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

/**
 * Implements WAI-ARIA roving tabindex navigation pattern for a composite list widget.
 *
 * Guarantees:
 * - Exactly one item in the collection has `tabIndex={0}` at any time; all others have `tabIndex={-1}`.
 * - Tab enters the composite at the active item only (one tab stop for the entire list).
 * - ArrowDown and ArrowUp move focus and active state across items.
 * - Home and End jump to the first and last items respectively.
 * - Enter and Space trigger the activation callback for the focused item.
 * - Clamps activeIndex within bounds when the collection size changes dynamically.
 */
export function useRovingTabindex({
  itemCount,
  initialIndex = 0,
  onActivate,
  loop = false,
}: UseRovingTabindexOptions) {
  const [activeIndex, setActiveIndex] = useState(() =>
    itemCount > 0 ? Math.min(Math.max(0, initialIndex), itemCount - 1) : 0
  );

  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Keep itemRefs array size in sync with itemCount
  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, itemCount);
  }, [itemCount]);

  // Keep activeIndex within bounds if itemCount changes
  useEffect(() => {
    setActiveIndex((prev) => {
      if (itemCount === 0) return 0;
      if (prev >= itemCount) return itemCount - 1;
      return prev;
    });
  }, [itemCount]);

  const focusItem = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (el) {
      el.focus();
    }
  }, []);

  const moveFocus = useCallback(
    (nextIndex: number) => {
      if (itemCount === 0) return;
      let target = nextIndex;
      if (loop) {
        target = (nextIndex + itemCount) % itemCount;
      } else {
        target = Math.max(0, Math.min(nextIndex, itemCount - 1));
      }
      setActiveIndex(target);
      focusItem(target);
    },
    [itemCount, loop, focusItem]
  );

  const registerItem = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const handleKeyDown = useCallback(
    (index: number, event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          moveFocus(index + 1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveFocus(index - 1);
          break;
        case 'Home':
          event.preventDefault();
          moveFocus(0);
          break;
        case 'End':
          event.preventDefault();
          moveFocus(itemCount - 1);
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          onActivate?.(index);
          break;
        default:
          break;
      }
    },
    [moveFocus, itemCount, onActivate]
  );

  const getItemProps = useCallback(
    (index: number): ItemRovingProps => ({
      tabIndex: index === activeIndex ? 0 : -1,
      ref: registerItem(index),
      onFocus: () => setActiveIndex(index),
      onKeyDown: (event: KeyboardEvent) => handleKeyDown(index, event),
    }),
    [activeIndex, registerItem, handleKeyDown]
  );

  return {
    activeIndex,
    setActiveIndex,
    moveFocus,
    getItemProps,
    registerItem,
  };
}

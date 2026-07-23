'use client';

import { useEffect, useRef } from 'react';
import { type Pair } from '@/lib/types';
import { IconButton } from '@/components/IconButton';

type Props = {
  pair: Pair | null;
  onClose: () => void;
};

export function PairsDrawer({ pair, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (pair) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else {
      previouslyFocusedElement.current?.focus();
    }
  }, [pair]);

  useEffect(() => {
    if (!pair) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pair, onClose]);

  useEffect(() => {
    if (!pair) return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement || document.activeElement === panel) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleTab);
    return () => panel.removeEventListener('keydown', handleTab);
  }, [pair]);

  if (!pair) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-40 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="w-full max-w-sm bg-white p-6 shadow-xl dark:bg-neutral-900 h-full overflow-y-auto focus:outline-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="drawer-title" className="text-xl font-semibold">Pair Details</h2>
          <IconButton label="Close details" onClick={onClose}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </IconButton>
        </div>
        <div className="flex flex-col gap-6">
          <section>
            <h3 className="text-sm font-medium text-neutral-500">Source</h3>
            <div className="mt-1 font-mono text-lg">{pair.source}</div>
          </section>
          <section>
            <h3 className="text-sm font-medium text-neutral-500">Destination</h3>
            <div className="mt-1 font-mono text-lg">{pair.destination}</div>
          </section>
        </div>
      </div>
    </div>
  );
}

# Swap Interface Skeleton Loading and Scoped Error Boundaries

## Overview

Issue #731 addresses two critical user experience deficiencies in the swap interface:

1. **Blank flash during loading**: While dynamic client code loads, users experienced a jarring blank viewport.
2. **Whole-page crashes on subtree failures**: Unhandled render throws in one section (e.g. quote history or slippage estimation) tore down the entire page, causing loss of form inputs and session context.

This implementation provides:

- Skeleton placeholders (`SwapSkeleton`) matching exact layout dimensions to eliminate Cumulative Layout Shift (CLS).
- Scoped React error boundaries (`SwapErrorBoundary`) with isolated retry mechanisms for individual sections.
- Accessible loading announcements via `aria-busy` and visually hidden live regions (`sr-only`).

---

## Architecture & Components

### 1. `SwapErrorBoundary` (`src/components/SwapErrorBoundary.tsx`)

A React class component error boundary with scoped failure containment:

- **Class-based Lifecycle**: Utilizes `getDerivedStateFromError` and `componentDidCatch` to intercept render throws.
- **Isolated Remount on Retry**: Maintains an internal `retryKey` that increments when the user clicks **Try again**, forcing React to unmount and remount the child subtree cleanly without refreshing the browser.
- **Observability**: Logs caught errors and component stacks via `console.error` with section tags (`SwapErrorBoundary [section] caught:`), matching the repository's convention in `SegmentError.tsx` and `app/error.tsx`.
- **Accessible Failure Notification**: Employs `role="alert"` for the error container to promptly notify screen readers.

### 2. `SwapSkeleton` (`src/components/SwapSkeleton.tsx`)

A placeholder component that mirrors the structure of `QuoteClient`:

- **Matching Layout**: Mirrored header, quote history, form inputs, buttons, and slippage indicator blocks with exact height and width utility classes (`h-10`, `max-w-2xl`, etc.).
- **Assistive Technology Announcements**: Marked with `role="status"`, `aria-busy="true"`, `aria-label="Loading swap interface"`, and an internal `.sr-only` text node ("Loading swap interface…").

### 3. Server Integration (`src/app/quote/page.tsx`)

Wraps `QuoteClient` in `SwapErrorBoundary` and `Suspense`:

```tsx
export default function QuotePage() {
  return (
    <SwapErrorBoundary section="swap interface">
      <Suspense fallback={<SwapSkeleton />}>
        <QuoteClient />
      </Suspense>
    </SwapErrorBoundary>
  );
}
```

---

## Edge Cases Verified

All five edge cases explicitly mandated by Issue #731 are verified in unit and integration test suites:

1. **Loading → skeleton, then content**: Verified with Suspense integration tests where the skeleton renders first, followed by real content upon resolution.
2. **Subtree throws → only that section shows the error**: Sibling boundaries remain unaffected when one child subtree throws.
3. **Retry → re-renders the section**: Triggering "Try again" increments the boundary `retryKey` and mounts a clean instance of the child.
4. **No layout shift on swap**: Placeholder elements have explicit height dimensions and match container styling (`max-w-2xl`, `gap-10`, `p-8`).
5. **Loading announced**: Assistive tech receives clear `role="status"` and `aria-busy="true"` signals.

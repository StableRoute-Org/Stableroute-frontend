/**
 * Integration tests for skeleton loading and error boundaries
 * on the swap interface (issue #731).
 *
 * Covers every required edge case:
 * 1. loading -> skeleton, then content
 * 2. subtree throws -> only that section shows the error
 * 3. retry -> re-renders the section
 * 4. no layout shift on swap
 * 5. loading announced to assistive tech
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import { Suspense, type ReactNode } from 'react';
import { SwapErrorBoundary } from '@/components/SwapErrorBoundary';
import { SwapSkeleton } from '@/components/SwapSkeleton';

/* ---------- helpers ---------- */

let resolveClient: () => void;

/**
 * Simulates a lazily-loaded client component. When rendered inside
 * `Suspense`, it will suspend until `resolveClient()` is called,
 * at which point it renders its children.
 */
function LazyChild({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function SuspendingChild() {
  // We simulate Suspense by throwing a promise
  throw new Promise<void>((resolve) => {
    resolveClient = resolve;
  });
}

/** Suppress noisy error-boundary console output during tests. */
let originalError: typeof console.error;
beforeEach(() => {
  originalError = console.error;
  console.error = jest.fn();
});
afterEach(() => {
  console.error = originalError;
});

/* ---------- integration tests ---------- */

describe('Swap interface: skeleton + error boundaries (integration)', () => {
  it('edge case 1: loading → skeleton, then content', async () => {
    let resolve: () => void = () => {};
    let suspended = false;

    function SuspendOnce({ children }: { children: ReactNode }) {
      if (!suspended) {
        suspended = true;
        throw new Promise<void>((r) => {
          resolve = r;
        });
      }
      return <>{children}</>;
    }

    render(
      <SwapErrorBoundary section="swap interface">
        <Suspense fallback={<SwapSkeleton />}>
          <SuspendOnce>
            <p>Real content</p>
          </SuspendOnce>
        </Suspense>
      </SwapErrorBoundary>
    );

    // Skeleton is visible while loading
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading swap interface…')).toBeInTheDocument();
    expect(screen.queryByText('Real content')).not.toBeInTheDocument();

    // Resolve the suspension
    await act(async () => {
      resolve();
    });

    // Content replaces skeleton
    expect(screen.getByText('Real content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('edge case 2: subtree throws → only that section shows the error', () => {
    function CrashingSection() {
      throw new Error('section crash');
    }

    render(
      <div>
        <SwapErrorBoundary section="quote form">
          <CrashingSection />
        </SwapErrorBoundary>
        <SwapErrorBoundary section="quote history">
          <p>History works fine</p>
        </SwapErrorBoundary>
      </div>
    );

    // The crashing section shows the error UI
    expect(
      screen.getByText(/The quote form section hit an error/)
    ).toBeInTheDocument();

    // The sibling section is unaffected
    expect(screen.getByText('History works fine')).toBeInTheDocument();
  });

  it('edge case 3: retry → re-renders the section successfully', () => {
    let shouldCrash = true;

    function SometimesCrashes() {
      if (shouldCrash) throw new Error('first render crash');
      return <p>Retry succeeded</p>;
    }

    render(
      <SwapErrorBoundary section="slippage">
        <SometimesCrashes />
      </SwapErrorBoundary>
    );

    // Error UI
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the condition and click retry
    shouldCrash = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // Section re-renders successfully
    expect(screen.getByText('Retry succeeded')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('edge case 4: no layout shift on swap — skeleton has matching dimensions', () => {
    const { container } = render(<SwapSkeleton />);
    const wrapper = container.firstElementChild as HTMLElement;

    // The skeleton wrapper matches the real content wrapper's layout classes
    expect(wrapper.className).toContain('max-w-2xl');
    expect(wrapper.className).toContain('min-h-screen');
    expect(wrapper.className).toContain('gap-10');
    expect(wrapper.className).toContain('p-8');

    // All pulse elements have explicit height to prevent CLS
    const pulseElements = container.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
    for (const el of pulseElements) {
      expect(el.className).toMatch(/h-\d+/);
    }
  });

  it('edge case 5: loading announced to assistive tech', () => {
    render(<SwapSkeleton />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label', 'Loading swap interface');

    // Screen reader text
    const srText = screen.getByText('Loading swap interface…');
    expect(srText).toHaveClass('sr-only');
  });
});

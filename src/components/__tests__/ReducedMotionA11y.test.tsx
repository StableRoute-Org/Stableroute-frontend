/**
 * Smoke tests for Issue #309 – prefers-reduced-motion accessibility.
 *
 * These tests verify that the three animated components (Spinner, loading
 * skeletons, and ToastProvider) each preserve their accessibility markup
 * regardless of whether CSS animations are running.  JSDOM does not execute
 * CSS, so the tests focus on the DOM roles and labels that screen readers
 * depend on – exactly the attributes that must survive when reduced-motion
 * CSS collapses the animations to near-zero duration.
 *
 * Coverage:
 *   - Spinner: role="status", sr-only label, animate-spin class retained
 *   - Loading: main#main-content landmark, animate-pulse skeleton elements
 *   - ToastProvider: notifications region, per-toast role="status"/"alert"
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Spinner } from '../Spinner';
import Loading from '../../app/loading';
import { ToastProvider, useToast } from '../ToastProvider';

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

describe('Spinner – reduced-motion accessibility smoke tests', () => {
  it('exposes role=status so screen readers announce loading state', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it("provides a visible sr-only label (default: 'Loading')", () => {
    render(<Spinner />);
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('accepts and announces a custom label', () => {
    render(<Spinner label="Fetching data" />);
    expect(screen.getByRole('status')).toHaveTextContent('Fetching data');
  });

  it('keeps the animate-spin class on the SVG (visual; not removed for reduced-motion)', () => {
    render(<Spinner />);
    // The SVG carries animate-spin; CSS collapses its duration but the class
    // stays so the DOM is always consistent.
    const svg = document.querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
  });

  it('hides the SVG from assistive technology with aria-hidden', () => {
    render(<Spinner />);
    const svg = document.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });
});

// ---------------------------------------------------------------------------
// Loading skeleton (src/app/loading.tsx)
// ---------------------------------------------------------------------------

describe('Loading skeleton – reduced-motion accessibility smoke tests', () => {
  it('renders the #main-content focus landmark', () => {
    render(<Loading />);
    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main?.tagName.toLowerCase()).toBe('main');
  });

  it('exposes tabIndex=-1 so skip-navigation links can focus it', () => {
    render(<Loading />);
    expect(document.getElementById('main-content')).toHaveAttribute(
      'tabIndex',
      '-1'
    );
  });

  it('renders exactly three skeleton placeholder divs with animate-pulse', () => {
    render(<Loading />);
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// ToastProvider
// ---------------------------------------------------------------------------

function ToastA11yHarness() {
  const { push } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => push('info message', 'info', { sticky: true })}
      >
        push-info
      </button>
      <button
        type="button"
        onClick={() => push('error message', 'error', { sticky: true })}
      >
        push-error
      </button>
    </div>
  );
}

describe('ToastProvider – reduced-motion accessibility smoke tests', () => {
  it('renders a notifications region accessible to assistive technology', () => {
    render(
      <ToastProvider>
        <ToastA11yHarness />
      </ToastProvider>
    );
    expect(
      screen.getByRole('region', { name: /notifications/i })
    ).toBeInTheDocument();
  });

  it('notifications region is an aria-live=polite region', () => {
    render(
      <ToastProvider>
        <ToastA11yHarness />
      </ToastProvider>
    );
    const region = screen.getByRole('region', { name: /notifications/i });
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('info toast uses role=status so screen readers announce it politely', () => {
    render(
      <ToastProvider>
        <ToastA11yHarness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'push-info' }));
    expect(screen.getByRole('status')).toHaveTextContent('info message');
  });

  it('error toast uses role=alert so screen readers announce it assertively', () => {
    render(
      <ToastProvider>
        <ToastA11yHarness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'push-error' }));
    expect(screen.getByRole('alert')).toHaveTextContent('error message');
  });

  it('each toast has a Dismiss button with a descriptive aria-label', () => {
    render(
      <ToastProvider>
        <ToastA11yHarness />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'push-info' }));
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });
});

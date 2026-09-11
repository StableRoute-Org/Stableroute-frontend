import { render, screen } from '@testing-library/react';
import { SwapSkeleton } from '../SwapSkeleton';

describe('SwapSkeleton', () => {
  it('renders a loading status container', () => {
    render(<SwapSkeleton />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label', 'Loading swap interface');
  });

  it('announces loading to assistive tech via sr-only text', () => {
    render(<SwapSkeleton />);
    expect(screen.getByText('Loading swap interface…')).toHaveClass('sr-only');
  });

  it('renders skeleton placeholder blocks (no layout shift)', () => {
    const { container } = render(<SwapSkeleton />);
    // The skeleton should contain multiple pulse-animated placeholder divs.
    // We count the animate-pulse elements to confirm all sections are represented.
    const pulseElements = container.querySelectorAll('.animate-pulse');
    // Header (2) + History (3) + Form (5) + Slippage (1) = 11
    expect(pulseElements.length).toBe(11);
  });

  it('does not shift layout — placeholders have explicit dimensions', () => {
    const { container } = render(<SwapSkeleton />);
    const pulseElements = container.querySelectorAll('.animate-pulse');
    for (const el of pulseElements) {
      const classes = el.className;
      // Every pulse element should have an explicit height class
      expect(classes).toMatch(/h-\d+/);
    }
  });
});

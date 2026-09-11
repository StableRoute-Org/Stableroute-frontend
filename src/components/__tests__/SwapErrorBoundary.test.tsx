import { render, screen, fireEvent } from '@testing-library/react';
import { SwapErrorBoundary } from '../SwapErrorBoundary';

/* ---------- helpers ---------- */

/** Component that throws on render when `shouldThrow` is true. */
function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('💥 boom');
  return <p>Child content</p>;
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

/* ---------- unit tests ---------- */

describe('SwapErrorBoundary', () => {
  it('renders children when no error is thrown', () => {
    render(
      <SwapErrorBoundary section="quote form">
        <p>Hello world</p>
      </SwapErrorBoundary>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows localised error UI when a subtree throws', () => {
    render(
      <SwapErrorBoundary section="quote form">
        <Bomb shouldThrow />
      </SwapErrorBoundary>
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText(/The quote form section hit an error/)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
  });

  it('retries and re-renders children on retry click', () => {
    let shouldThrow = true;
    function MaybeThrow() {
      if (shouldThrow) throw new Error('💥');
      return <p>Recovered</p>;
    }

    render(
      <SwapErrorBoundary section="slippage">
        <MaybeThrow />
      </SwapErrorBoundary>
    );

    // Error state is shown
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Fix the child and retry
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not crash sibling boundaries when one subtree throws', () => {
    render(
      <div>
        <SwapErrorBoundary section="form">
          <Bomb shouldThrow />
        </SwapErrorBoundary>
        <SwapErrorBoundary section="history">
          <p>History is fine</p>
        </SwapErrorBoundary>
      </div>
    );

    // Form boundary shows the error
    expect(
      screen.getByText(/The form section hit an error/)
    ).toBeInTheDocument();

    // History boundary still renders its children
    expect(screen.getByText('History is fine')).toBeInTheDocument();
  });

  it('logs the error for observability', () => {
    render(
      <SwapErrorBoundary section="quote form">
        <Bomb shouldThrow />
      </SwapErrorBoundary>
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('SwapErrorBoundary [quote form]'),
      expect.any(Error),
      expect.anything()
    );
  });
});

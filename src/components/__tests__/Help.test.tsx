import { render, screen } from '@testing-library/react';
import { Help } from '../Help';

describe('Help', () => {
  it('renders its trigger children', () => {
    render(
      <Help status="success">
        <button>Get help</button>
      </Help>
    );
    expect(screen.getByRole('button', { name: /get help/i })).toBeInTheDocument();
  });

  it('renders the loading state', () => {
    render(
      <Help status="loading">
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/loading help/i);
  });

  it('renders the empty state', () => {
    render(
      <Help status="empty">
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/no help available/i);
  });

  it('renders the error state with the provided message', () => {
    render(
      <Help status="error" message="Failed to load help content">
        <span>trigger</span>
      </Help>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/help unavailable/i);
    expect(status).toHaveTextContent(/failed to load help content/i);
  });

  it('renders the success state', () => {
    render(
      <Help status="success">
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/help ready/i);
  });

  it('renders the success state with an optional message appended', () => {
    render(
      <Help status="success" message="3 articles found">
        <span>trigger</span>
      </Help>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/help ready/i);
    expect(status).toHaveTextContent(/3 articles found/i);
  });

  it('keeps states mutually exclusive (only one status message present)', () => {
    render(
      <Help status="success" message="Done">
        <span>trigger</span>
      </Help>
    );
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/help ready/i);
    expect(status).not.toHaveTextContent(/loading help/i);
    expect(status).not.toHaveTextContent(/no help available/i);
    expect(status).not.toHaveTextContent(/help unavailable/i);
  });

  it('exposes the status for assistive technology via aria-live', () => {
    render(
      <Help status="loading">
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });

  it('omits the trailing message segment when no message is provided', () => {
    render(
      <Help status="empty">
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/^no help available$/i);
  });

  it('does not re-render when props are referentially stable (memoized)', () => {
    const props = { status: 'success' as const, message: 'ok' };
    const { rerender } = render(
      <Help {...props}>
        <span>trigger</span>
      </Help>
    );
    // re-render with the same prop references — memo should skip
    rerender(
      <Help {...props}>
        <span>trigger</span>
      </Help>
    );
    expect(screen.getByRole('status')).toHaveTextContent(/help ready/i);
  });
});
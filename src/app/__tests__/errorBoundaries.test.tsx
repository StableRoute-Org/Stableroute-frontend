/**
 * Tests for root and route-segment error boundary components.
 *
 * Coverage targets:
 *   - src/app/error.tsx           (root boundary)
 *   - src/app/quote/error.tsx     (segment boundary – delegates to SegmentError)
 *   - src/app/events/error.tsx    (segment boundary – delegates to SegmentError)
 *
 * For each boundary we verify:
 *   - A user-safe message is rendered via role="alert".
 *   - The raw Error.stack is never surfaced in the DOM.
 *   - Backend detail fields that should not leak (e.g. internal stack lines)
 *     are absent from the rendered output.
 *   - The reset callback is invoked exactly once when the retry control is activated.
 *   - The digest-present and digest-absent branches are both exercised (logging).
 *   - The requestId-present and requestId-absent branches are rendered correctly.
 *   - The skip-link focus target (id="main-content", tabIndex=-1) is present.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import RootError from '../error';
import QuoteError from '../quote/error';
import EventsError from '../events/error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an error with optional extra properties. */
function makeError(
  message: string,
  extras: Partial<{ digest: string; requestId: string; stack: string }> = {}
): Error & { digest?: string; requestId?: string } {
  const err = Object.assign(new Error(message), extras);
  // Ensure a recognisable stack is present so we can assert it never leaks.
  err.stack = `Error: ${message}\n    at fakeInternal (/app/server/db.ts:42:7)\n    at sensitiveRoute (/app/server/routes.ts:17:3)`;
  return err;
}

// ---------------------------------------------------------------------------
// Root error boundary – src/app/error.tsx
// ---------------------------------------------------------------------------

describe('RootError (src/app/error.tsx)', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error noise in test output while still being able to
    // assert on what was logged.
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  // ── Heading ───────────────────────────────────────────────────────────────

  it('renders the "Something went wrong." heading', () => {
    render(<RootError error={makeError('boom')} reset={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /something went wrong\./i })
    ).toBeInTheDocument();
  });

  // ── Message rendering ─────────────────────────────────────────────────────

  it('announces the error message via role="alert"', () => {
    render(<RootError error={makeError('Network failure')} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Network failure');
  });

  it('falls back to "Unexpected error." when the error message is empty', () => {
    render(<RootError error={makeError('')} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected error.');
  });

  // ── Stack / backend-detail redaction ──────────────────────────────────────

  it('never renders the raw Error.stack in the DOM', () => {
    render(
      <RootError
        error={makeError('Exposed detail', {
          stack:
            'Error: Exposed detail\n    at sensitiveFile (/secrets/db.ts:1:1)',
        })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('sensitiveFile');
    expect(document.body.textContent).not.toContain('/secrets/db.ts');
  });

  it('does not leak internal stack frames even when the error has a digest', () => {
    const err = makeError('internal', { digest: 'abc-123' });
    err.stack =
      'Error: internal\n    at privateHandler (/internal/service.ts:99:5)';
    render(<RootError error={err} reset={() => {}} />);
    expect(document.body.textContent).not.toContain('privateHandler');
    expect(document.body.textContent).not.toContain('/internal/service.ts');
  });

  it('does not render the error digest value in the UI', () => {
    render(
      <RootError
        error={makeError('boom', { digest: 'digest-secret-value' })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('digest-secret-value');
  });

  // ── Request ID ────────────────────────────────────────────────────────────

  it('shows the Request ID when the error carries one', () => {
    const error = makeError('boom', { requestId: 'req-abc-123' });
    render(<RootError error={error} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Request ID:.*req-abc-123/);
  });

  it('omits the Request ID line when the error has none', () => {
    render(<RootError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Request ID/);
  });

  it('renders requestId inside a <code> element for machine-readability', () => {
    const error = makeError('boom', { requestId: 'req-xyz' });
    render(<RootError error={error} reset={() => {}} />);
    const code = document.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toBe('req-xyz');
  });

  // ── Reset / retry action ──────────────────────────────────────────────────

  it('invokes the reset callback exactly once when "Try again" is clicked', () => {
    const reset = jest.fn();
    render(<RootError error={makeError('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not invoke reset before the button is clicked', () => {
    const reset = jest.fn();
    render(<RootError error={makeError('boom')} reset={reset} />);
    expect(reset).not.toHaveBeenCalled();
  });

  it('invokes reset on each click independently', () => {
    const reset = jest.fn();
    render(<RootError error={makeError('boom')} reset={reset} />);
    const btn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(reset).toHaveBeenCalledTimes(2);
  });

  // ── Logging (digest branch) ───────────────────────────────────────────────

  it('logs the digest when the error carries one', () => {
    const error = makeError('boom', { digest: 'digest-xyz' });
    render(<RootError error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'App error boundary caught:',
      'digest-xyz'
    );
  });

  it('logs the message when the error has no digest', () => {
    render(<RootError error={makeError('network timeout')} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'App error boundary caught:',
      'network timeout'
    );
  });

  it('logs on mount (effect fires once per render)', () => {
    render(<RootError error={makeError('once')} reset={() => {}} />);
    // Should be called exactly once for the initial mount.
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  // ── Accessibility / focus management ─────────────────────────────────────

  it('exposes the main-content skip-link target with id and tabIndex', () => {
    render(<RootError error={makeError('boom')} reset={() => {}} />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('suppresses the default focus outline on the main element', () => {
    render(<RootError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('main').className).toContain('focus:outline-none');
  });

  it('renders the retry button with type="button" to avoid accidental form submission', () => {
    render(<RootError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute(
      'type',
      'button'
    );
  });
});

// ---------------------------------------------------------------------------
// QuoteError – src/app/quote/error.tsx
// ---------------------------------------------------------------------------

describe('QuoteError (src/app/quote/error.tsx)', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  // ── Segment identity ──────────────────────────────────────────────────────

  it('identifies itself as the quote segment in the heading', () => {
    render(<QuoteError error={makeError('boom')} reset={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /the quote page hit an error\./i })
    ).toBeInTheDocument();
  });

  // ── Message rendering ─────────────────────────────────────────────────────

  it('announces the error message via role="alert"', () => {
    render(
      <QuoteError error={makeError('Quote service unavailable')} reset={() => {}} />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Quote service unavailable'
    );
  });

  it('falls back to "Unexpected error." when the error message is empty', () => {
    render(<QuoteError error={makeError('')} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected error.');
  });

  // ── Stack / backend-detail redaction ──────────────────────────────────────

  it('never renders the raw Error.stack in the DOM', () => {
    render(
      <QuoteError
        error={makeError('detail', {
          stack: 'Error: detail\n    at internalQuoteHandler (/src/quote.ts:7:1)',
        })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('internalQuoteHandler');
    expect(document.body.textContent).not.toContain('/src/quote.ts');
  });

  it('does not render the digest value in the UI', () => {
    render(
      <QuoteError
        error={makeError('boom', { digest: 'quote-digest-secret' })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('quote-digest-secret');
  });

  // ── Request ID ────────────────────────────────────────────────────────────

  it('shows the Request ID when the error carries one', () => {
    const error = makeError('boom', { requestId: 'req-quote-99' });
    render(<QuoteError error={error} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Request ID:.*req-quote-99/
    );
  });

  it('omits the Request ID line when the error has none', () => {
    render(<QuoteError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Request ID/);
  });

  // ── Reset / retry action ──────────────────────────────────────────────────

  it('invokes the reset callback exactly once when "Try again" is clicked', () => {
    const reset = jest.fn();
    render(<QuoteError error={makeError('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not invoke reset before the button is clicked', () => {
    const reset = jest.fn();
    render(<QuoteError error={makeError('boom')} reset={reset} />);
    expect(reset).not.toHaveBeenCalled();
  });

  // ── Logging (digest branch) ───────────────────────────────────────────────

  it('logs the digest when the error carries one', () => {
    const error = makeError('boom', { digest: 'quote-digest-abc' });
    render(<QuoteError error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'quote segment error boundary caught:',
      'quote-digest-abc'
    );
  });

  it('logs the message when the error has no digest', () => {
    render(
      <QuoteError error={makeError('bad request')} reset={() => {}} />
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'quote segment error boundary caught:',
      'bad request'
    );
  });

  // ── Accessibility / focus management ─────────────────────────────────────

  it('exposes the main-content skip-link target with id and tabIndex', () => {
    render(<QuoteError error={makeError('boom')} reset={() => {}} />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('renders the retry button with type="button"', () => {
    render(<QuoteError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute(
      'type',
      'button'
    );
  });
});

// ---------------------------------------------------------------------------
// EventsError – src/app/events/error.tsx
// ---------------------------------------------------------------------------

describe('EventsError (src/app/events/error.tsx)', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  // ── Segment identity ──────────────────────────────────────────────────────

  it('identifies itself as the events segment in the heading', () => {
    render(<EventsError error={makeError('boom')} reset={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /the events page hit an error\./i })
    ).toBeInTheDocument();
  });

  // ── Message rendering ─────────────────────────────────────────────────────

  it('announces the error message via role="alert"', () => {
    render(
      <EventsError
        error={makeError('Event log unavailable')}
        reset={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Event log unavailable');
  });

  it('falls back to "Unexpected error." when the error message is empty', () => {
    render(<EventsError error={makeError('')} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected error.');
  });

  // ── Stack / backend-detail redaction ──────────────────────────────────────

  it('never renders the raw Error.stack in the DOM', () => {
    render(
      <EventsError
        error={makeError('detail', {
          stack:
            'Error: detail\n    at internalEventsHandler (/src/events.ts:12:1)',
        })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('internalEventsHandler');
    expect(document.body.textContent).not.toContain('/src/events.ts');
  });

  it('does not render the digest value in the UI', () => {
    render(
      <EventsError
        error={makeError('boom', { digest: 'events-digest-secret' })}
        reset={() => {}}
      />
    );
    expect(document.body.textContent).not.toContain('events-digest-secret');
  });

  // ── Request ID ────────────────────────────────────────────────────────────

  it('shows the Request ID when the error carries one', () => {
    const error = makeError('boom', { requestId: 'req-events-77' });
    render(<EventsError error={error} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      /Request ID:.*req-events-77/
    );
  });

  it('omits the Request ID line when the error has none', () => {
    render(<EventsError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Request ID/);
  });

  // ── Reset / retry action ──────────────────────────────────────────────────

  it('invokes the reset callback exactly once when "Try again" is clicked', () => {
    const reset = jest.fn();
    render(<EventsError error={makeError('boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('does not invoke reset before the button is clicked', () => {
    const reset = jest.fn();
    render(<EventsError error={makeError('boom')} reset={reset} />);
    expect(reset).not.toHaveBeenCalled();
  });

  // ── Logging (digest branch) ───────────────────────────────────────────────

  it('logs the digest when the error carries one', () => {
    const error = makeError('boom', { digest: 'events-digest-xyz' });
    render(<EventsError error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'events segment error boundary caught:',
      'events-digest-xyz'
    );
  });

  it('logs the message when the error has no digest', () => {
    render(
      <EventsError error={makeError('poll error')} reset={() => {}} />
    );
    expect(errorSpy).toHaveBeenCalledWith(
      'events segment error boundary caught:',
      'poll error'
    );
  });

  // ── Accessibility / focus management ─────────────────────────────────────

  it('exposes the main-content skip-link target with id and tabIndex', () => {
    render(<EventsError error={makeError('boom')} reset={() => {}} />);
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveAttribute('tabindex', '-1');
  });

  it('renders the retry button with type="button"', () => {
    render(<EventsError error={makeError('boom')} reset={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toHaveAttribute(
      'type',
      'button'
    );
  });
});

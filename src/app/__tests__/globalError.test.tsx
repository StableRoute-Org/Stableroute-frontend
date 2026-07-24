import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError, { GlobalErrorContent } from '../global-error';

function makeError(
  message = 'boom',
  extra?: { digest?: string; requestId?: string }
) {
  const err = new Error(message);
  if (extra?.digest !== undefined)
    (err as Error & { digest: string }).digest = extra.digest;
  if (extra?.requestId !== undefined) {
    Object.assign(err, { requestId: extra.requestId });
  }
  return err;
}

describe('GlobalErrorContent', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it('renders the heading', () => {
    render(<GlobalErrorContent error={makeError()} reset={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /Something went wrong\./i })
    ).toBeInTheDocument();
  });

  it('shows the error message in a role=alert container', () => {
    render(
      <GlobalErrorContent
        error={makeError('connection lost')}
        reset={() => {}}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('connection lost');
  });

  it('falls back to a generic message when the error message is empty', () => {
    render(<GlobalErrorContent error={makeError('')} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Unexpected error.');
  });

  it('shows the request id when the error carries one', () => {
    const error = makeError('boom', { requestId: 'req-42' });
    render(<GlobalErrorContent error={error} reset={() => {}} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/Request ID: req-42/);
  });

  it('omits the request id line when the error has none', () => {
    render(<GlobalErrorContent error={makeError()} reset={() => {}} />);
    expect(screen.getByRole('alert')).not.toHaveTextContent(/Request ID/);
  });

  it('invokes reset exactly once when Try again is clicked', () => {
    const reset = jest.fn();
    render(<GlobalErrorContent error={makeError()} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('logs the digest when the error carries one', () => {
    const error = makeError('boom', { digest: 'digest-123' });
    render(<GlobalErrorContent error={error} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'Global error boundary caught:',
      'digest-123'
    );
  });

  it('logs the message when the error has no digest', () => {
    render(<GlobalErrorContent error={makeError('boom')} reset={() => {}} />);
    expect(errorSpy).toHaveBeenCalledWith(
      'Global error boundary caught:',
      'boom'
    );
  });

  it('preserves the main-content skip-link target for focus management', () => {
    render(<GlobalErrorContent error={makeError()} reset={() => {}} />);
    const el = document.getElementById('main-content');
    expect(el).not.toBeNull();
    expect(el).toHaveAttribute('tabindex', '-1');
  });

  it('includes inline style safety-net attributes unconditionally', () => {
    render(<GlobalErrorContent error={makeError()} reset={() => {}} />);
    const container = document.getElementById('main-content')!;
    const style = container.getAttribute('style') ?? '';
    expect(style).toContain('display:');
    expect(style).toContain('min-height:');
    expect(style).toContain('font-family:');
  });
});

describe('GlobalError wrapper', () => {
  const error = makeError('boom', { digest: 'd1', requestId: 'r1' });
  const reset = jest.fn();

  it('is a valid function export', () => {
    expect(typeof GlobalError).toBe('function');
  });

  it('returns an <html> element as its root', () => {
    const element = GlobalError({ error, reset });
    expect(element.type).toBe('html');
  });

  it('sets lang="en" and dir="ltr" on the html element', () => {
    const element = GlobalError({ error, reset });
    expect(element.props.lang).toBe('en');
    expect(element.props.dir).toBe('ltr');
  });

  it('contains a <body> child', () => {
    const element = GlobalError({ error, reset });
    const body = element.props.children;
    expect(React.isValidElement(body)).toBe(true);
    expect(body.type).toBe('body');
  });

  it('body wraps GlobalErrorContent', () => {
    const element = GlobalError({ error, reset });
    const content = element.props.children.props.children;
    expect(React.isValidElement(content)).toBe(true);
    expect(content.type).toBe(GlobalErrorContent);
  });

  it('forwards error and reset props to GlobalErrorContent', () => {
    const element = GlobalError({ error, reset });
    const content = element.props.children.props.children;
    expect(content.props.error).toBe(error);
    expect(content.props.reset).toBe(reset);
  });
});

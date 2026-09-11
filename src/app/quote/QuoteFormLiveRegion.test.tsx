import { render, screen } from '@testing-library/react';
import { QuoteFormLiveRegion } from './QuoteFormLiveRegion';
import type { QuoteFieldError } from './quoteSchema';

describe('QuoteFormLiveRegion', () => {
  it('renders null when there are no errors', () => {
    const { container } = render(<QuoteFormLiveRegion errors={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('quote-form-live-region')).toBeNull();
  });

  it('announces errors politely by default when editing/fixing fields', () => {
    const errors: QuoteFieldError[] = [
      {
        field: 'source',
        code: 'INVALID_ASSET_CODE',
        message: 'Use 1-12 letters or numbers.',
      },
    ];

    render(<QuoteFormLiveRegion errors={errors} isAssertive={false} />);
    const region = screen.getByTestId('quote-form-live-region');

    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveTextContent('1 error found: Source asset.');
  });

  it('announces errors assertively when submit is attempted with errors', () => {
    const errors: QuoteFieldError[] = [
      {
        field: 'source',
        code: 'INVALID_ASSET_CODE',
        message: 'Use 1-12 letters or numbers.',
      },
      {
        field: 'dest',
        code: 'ASSETS_MUST_DIFFER',
        message: 'Source and destination assets must differ.',
      },
    ];

    render(<QuoteFormLiveRegion errors={errors} isAssertive={true} />);
    const region = screen.getByTestId('quote-form-live-region');

    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(region).toHaveTextContent(
      '2 errors found: Source asset, Destination asset.'
    );
  });
});

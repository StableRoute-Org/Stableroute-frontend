import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import QuotePage from './page';

const getSourceInput = () =>
  screen.getByRole('textbox', { name: /Source asset/i });
const getDestinationInput = () =>
  screen.getByRole('textbox', { name: /Destination asset/i });
const getAmountInput = () =>
  screen.getByRole('textbox', { name: /Amount \(base units\)/i });

describe('Schema-validated swap form integration (#727)', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
  });

  describe('Edge case 1: invalid field -> inline message + described-by wired', () => {
    it('wires aria-describedby and role=alert to inline error message on invalid input', async () => {
      render(<QuotePage />);
      const sourceInput = getSourceInput();

      fireEvent.change(sourceInput, { target: { value: 'INV@LID!' } });
      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      await waitFor(() => {
        expect(sourceInput).toHaveAttribute('aria-invalid', 'true');
      });

      const describedById = sourceInput.getAttribute('aria-describedby');
      expect(describedById).toBeTruthy();
      expect(describedById).toContain('source_asset-err');

      const errorElement = document.getElementById('source_asset-err');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('role', 'alert');
      expect(errorElement).toHaveTextContent('Use 1-12 letters or numbers.');
    });
  });

  describe('Edge case 2: submit with errors -> focus first invalid, summary announced', () => {
    it('moves focus to first invalid field and announces summary assertively on submit attempt', async () => {
      const mockFetch = jest.fn();
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      render(<QuotePage />);
      const sourceInput = getSourceInput();

      // Submit with empty fields
      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      // First invalid field (source asset) must receive focus
      expect(document.activeElement).toBe(sourceInput);

      // Summary live region must announce assertively on submit
      const liveRegion = screen.getByTestId('quote-form-live-region');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent(
        '3 errors found: Source asset, Destination asset, Amount.'
      );

      // Submit must be blocked
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('focuses destination asset when only destination is invalid on submit', async () => {
      render(<QuotePage />);
      fireEvent.change(getSourceInput(), { target: { value: 'USDC' } });
      fireEvent.change(getDestinationInput(), { target: { value: '' } });
      fireEvent.change(getAmountInput(), { target: { value: '100' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      expect(document.activeElement).toBe(getDestinationInput());
      const liveRegion = screen.getByTestId('quote-form-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('1 error found: Destination asset.');
    });

    it('focuses amount field when only amount is invalid on submit', async () => {
      render(<QuotePage />);
      fireEvent.change(getSourceInput(), { target: { value: 'USDC' } });
      fireEvent.change(getDestinationInput(), { target: { value: 'EURC' } });
      fireEvent.change(getAmountInput(), { target: { value: '0' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      expect(document.activeElement).toBe(getAmountInput());
      const liveRegion = screen.getByTestId('quote-form-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
      expect(liveRegion).toHaveTextContent('1 error found: Amount.');
    });
  });

  describe('Edge case 3: fix a field -> its error clears', () => {
    it('clears field errors progressively as user fixes each field', async () => {
      render(<QuotePage />);

      // Submit empty form -> 3 errors
      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      expect(getSourceInput()).toHaveAttribute('aria-invalid', 'true');
      expect(getDestinationInput()).toHaveAttribute('aria-invalid', 'true');
      expect(getAmountInput()).toHaveAttribute('aria-invalid', 'true');

      // Fix source field
      fireEvent.change(getSourceInput(), { target: { value: 'USDC' } });
      expect(getSourceInput()).not.toHaveAttribute('aria-invalid');
      expect(document.getElementById('source_asset-err')).toBeNull();

      // Live region updates politely
      const liveRegion = screen.getByTestId('quote-form-live-region');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(
        '2 errors found: Destination asset, Amount.'
      );

      // Fix destination field
      fireEvent.change(getDestinationInput(), { target: { value: 'EURC' } });
      expect(getDestinationInput()).not.toHaveAttribute('aria-invalid');
      expect(document.getElementById('dest_asset-err')).toBeNull();

      // Fix amount field
      fireEvent.change(getAmountInput(), { target: { value: '1000' } });
      expect(getAmountInput()).not.toHaveAttribute('aria-invalid');
      expect(document.getElementById('amount-err')).toBeNull();

      // All errors cleared -> live region returns null
      expect(screen.queryByTestId('quote-form-live-region')).toBeNull();
    });

    it('clears ASSETS_MUST_DIFFER error when source is updated to differ from destination', async () => {
      render(<QuotePage />);
      fireEvent.change(getSourceInput(), { target: { value: 'USDC' } });
      fireEvent.change(getDestinationInput(), { target: { value: 'USDC' } });
      fireEvent.change(getAmountInput(), { target: { value: '100' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      expect(getDestinationInput()).toHaveAttribute('aria-invalid', 'true');
      expect(document.getElementById('dest_asset-err')).toHaveTextContent(
        'Source and destination assets must differ.'
      );

      // Change source so assets differ
      fireEvent.change(getSourceInput(), { target: { value: 'EURC' } });

      expect(getDestinationInput()).not.toHaveAttribute('aria-invalid');
      expect(document.getElementById('dest_asset-err')).toBeNull();
      expect(screen.queryByTestId('quote-form-live-region')).toBeNull();
    });
  });

  describe('Edge case 4: all valid -> submits', () => {
    it('submits request and renders quote when all form values are valid', async () => {
      const mockFetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            source_asset: 'USDC',
            dest_asset: 'EURC',
            amount: '1000000',
            estimated_rate: '1.05',
            route: ['USDC', 'EURC'],
          }),
      } as unknown as Response);
      globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

      render(<QuotePage />);
      fireEvent.change(getSourceInput(), { target: { value: 'USDC' } });
      fireEvent.change(getDestinationInput(), { target: { value: 'EURC' } });
      fireEvent.change(getAmountInput(), { target: { value: '1000000' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      await waitFor(() => {
        expect(screen.getByText(/USDC → EURC/)).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          'source_asset=USDC&dest_asset=EURC&amount=1000000'
        ),
        expect.anything()
      );
      expect(screen.queryByTestId('quote-form-live-region')).toBeNull();
    });
  });

  describe('Edge case 5: messages are specific per field', () => {
    it('displays distinct, specific error messages tailored to each field', async () => {
      render(<QuotePage />);

      fireEvent.change(getSourceInput(), { target: { value: '@@@' } });
      fireEvent.change(getDestinationInput(), {
        target: { value: 'toolongassetcode' },
      });
      fireEvent.change(getAmountInput(), { target: { value: '-5' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      const sourceErr = document.getElementById('source_asset-err');
      const destErr = document.getElementById('dest_asset-err');
      const amountErr = document.getElementById('amount-err');

      expect(sourceErr).toHaveTextContent('Use 1-12 letters or numbers.');
      expect(destErr).toHaveTextContent('Use 1-12 letters or numbers.');
      expect(amountErr).toHaveTextContent(
        'Amount must be a positive integer (base units).'
      );
    });

    it('displays distinct message when destination equals source', async () => {
      render(<QuotePage />);

      fireEvent.change(getSourceInput(), { target: { value: 'DAI' } });
      fireEvent.change(getDestinationInput(), { target: { value: 'DAI' } });
      fireEvent.change(getAmountInput(), { target: { value: '1000' } });

      fireEvent.click(screen.getByRole('button', { name: /Get quote/i }));

      expect(document.getElementById('source_asset-err')).toBeNull();
      expect(document.getElementById('dest_asset-err')).toHaveTextContent(
        'Source and destination assets must differ.'
      );
      expect(document.getElementById('amount-err')).toBeNull();
    });
  });
});

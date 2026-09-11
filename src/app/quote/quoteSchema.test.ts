import {
  validateQuoteForm,
  validateQuoteField,
  formatValidationSummaryAnnouncement,
  normalizeAssetCode,
  isValidAmount,
  type QuoteFormValues,
} from './quoteSchema';

describe('quoteSchema', () => {
  describe('normalizeAssetCode', () => {
    it('accepts valid 1-12 alphanumeric asset codes and trims whitespace', () => {
      expect(normalizeAssetCode('USDC')).toBe('USDC');
      expect(normalizeAssetCode('  eurc  ')).toBe('eurc');
      expect(normalizeAssetCode('A1B2C3D4E5F6')).toBe('A1B2C3D4E5F6');
      expect(normalizeAssetCode('BTC')).toBe('BTC');
    });

    it('rejects empty, overlong, or non-alphanumeric values', () => {
      expect(normalizeAssetCode('')).toBeNull();
      expect(normalizeAssetCode('   ')).toBeNull();
      expect(normalizeAssetCode('TOOLONGASSETCODE')).toBeNull();
      expect(normalizeAssetCode('USD$')).toBeNull();
      expect(normalizeAssetCode('US_DC')).toBeNull();
    });
  });

  describe('isValidAmount', () => {
    it('accepts positive non-zero integers', () => {
      expect(isValidAmount('1')).toBe(true);
      expect(isValidAmount('1000000')).toBe(true);
      expect(isValidAmount('  42  ')).toBe(true);
    });

    it('rejects zero, negatives, decimals, and non-numeric strings', () => {
      expect(isValidAmount('0')).toBe(false);
      expect(isValidAmount('-100')).toBe(false);
      expect(isValidAmount('10.5')).toBe(false);
      expect(isValidAmount('abc')).toBe(false);
      expect(isValidAmount('')).toBe(false);
      expect(isValidAmount('0123')).toBe(false);
    });
  });

  describe('validateQuoteForm', () => {
    it('returns isValid: true when all fields are valid and distinct', () => {
      const values: QuoteFormValues = {
        source: 'USDC',
        dest: 'EURC',
        amount: '1000000',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.firstInvalidField).toBeNull();
      expect(result.fieldErrors).toEqual({});
    });

    it('detects invalid source asset', () => {
      const values: QuoteFormValues = {
        source: 'INVALID!!!',
        dest: 'EURC',
        amount: '100',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'source',
        code: 'INVALID_ASSET_CODE',
        message: 'Use 1-12 letters or numbers.',
      });
      expect(result.firstInvalidField).toBe('source');
      expect(result.fieldErrors.source).toBe('Use 1-12 letters or numbers.');
    });

    it('detects invalid destination asset', () => {
      const values: QuoteFormValues = {
        source: 'USDC',
        dest: '',
        amount: '100',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'dest',
        code: 'INVALID_ASSET_CODE',
        message: 'Use 1-12 letters or numbers.',
      });
      expect(result.firstInvalidField).toBe('dest');
      expect(result.fieldErrors.dest).toBe('Use 1-12 letters or numbers.');
    });

    it('detects when source and destination assets are identical', () => {
      const values: QuoteFormValues = {
        source: 'USDC',
        dest: 'usdc',
        amount: '100',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'dest',
        code: 'ASSETS_MUST_DIFFER',
        message: 'Source and destination assets must differ.',
      });
      expect(result.firstInvalidField).toBe('dest');
      expect(result.fieldErrors.dest).toBe(
        'Source and destination assets must differ.'
      );
    });

    it('detects invalid amount', () => {
      const values: QuoteFormValues = {
        source: 'USDC',
        dest: 'EURC',
        amount: 'not-a-number',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        field: 'amount',
        code: 'INVALID_AMOUNT',
        message: 'Amount must be a positive integer (base units).',
      });
      expect(result.firstInvalidField).toBe('amount');
      expect(result.fieldErrors.amount).toBe(
        'Amount must be a positive integer (base units).'
      );
    });

    it('identifies the first invalid field when multiple fields fail', () => {
      const values: QuoteFormValues = {
        source: '',
        dest: '',
        amount: '0',
      };
      const result = validateQuoteForm(values);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.firstInvalidField).toBe('source');
      expect(result.errors.map((e) => e.field)).toEqual([
        'source',
        'dest',
        'amount',
      ]);
    });
  });

  describe('validateQuoteField', () => {
    it('validates a single field in isolation given the form state', () => {
      const values: QuoteFormValues = {
        source: 'USDC',
        dest: 'USDC',
        amount: '1000',
      };

      expect(validateQuoteField('source', values)).toBeNull();
      expect(validateQuoteField('dest', values)).toEqual({
        field: 'dest',
        code: 'ASSETS_MUST_DIFFER',
        message: 'Source and destination assets must differ.',
      });
      expect(validateQuoteField('amount', values)).toBeNull();
    });
  });

  describe('formatValidationSummaryAnnouncement', () => {
    it('returns empty string for empty errors', () => {
      expect(formatValidationSummaryAnnouncement([])).toBe('');
    });

    it('formats a single error summary', () => {
      const errors = [
        {
          field: 'amount' as const,
          code: 'INVALID_AMOUNT' as const,
          message: 'Amount must be a positive integer (base units).',
        },
      ];
      expect(formatValidationSummaryAnnouncement(errors)).toBe(
        '1 error found: Amount.'
      );
    });

    it('formats multiple errors summary separated with commas', () => {
      const errors = [
        {
          field: 'source' as const,
          code: 'INVALID_ASSET_CODE' as const,
          message: 'Use 1-12 letters or numbers.',
        },
        {
          field: 'dest' as const,
          code: 'INVALID_ASSET_CODE' as const,
          message: 'Use 1-12 letters or numbers.',
        },
      ];
      expect(formatValidationSummaryAnnouncement(errors)).toBe(
        '2 errors found: Source asset, Destination asset.'
      );
    });
  });
});

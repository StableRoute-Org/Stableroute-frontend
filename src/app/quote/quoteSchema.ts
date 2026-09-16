/**
 * Declarative validation schema and structured error definitions
 * for the swap interface (quote) form (#727).
 *
 * Implements structured, typed errors with stable error codes and
 * sanitised messaging that guarantees no internal secrets or runtime
 * leakage.
 */

export type QuoteFormField = 'source' | 'dest' | 'amount';

export interface QuoteFormValues {
  source: string;
  dest: string;
  amount: string;
}

export type QuoteValidationErrorCode =
  'INVALID_ASSET_CODE' | 'ASSETS_MUST_DIFFER' | 'INVALID_AMOUNT';

export interface QuoteFieldError {
  readonly field: QuoteFormField;
  readonly code: QuoteValidationErrorCode;
  readonly message: string;
}

export interface QuoteValidationResult {
  readonly isValid: boolean;
  readonly errors: QuoteFieldError[];
  readonly fieldErrors: Partial<Record<QuoteFormField, string>>;
  readonly firstInvalidField: QuoteFormField | null;
}

export interface QuoteFieldValidator {
  readonly field: QuoteFormField;
  readonly validate: (values: QuoteFormValues) => QuoteFieldError | null;
}

export const ASSET_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

/**
 * Validates and trims an asset code (1-12 alphanumeric characters).
 * Returns the trimmed string if valid, or null if invalid.
 */
export function normalizeAssetCode(value: string): string | null {
  const trimmed = value.trim();
  return ASSET_CODE_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Validates that an amount string is a positive non-zero integer.
 */
export function isValidAmount(value: string): boolean {
  return /^[1-9]\d*$/.test(value.trim());
}

export const QUOTE_FIELD_LABELS: Record<QuoteFormField, string> = {
  source: 'Source asset',
  dest: 'Destination asset',
  amount: 'Amount',
};

export const QUOTE_FORM_SCHEMA: readonly QuoteFieldValidator[] = [
  {
    field: 'source',
    validate: (values: QuoteFormValues): QuoteFieldError | null => {
      const normalized = normalizeAssetCode(values.source);
      if (!normalized) {
        return {
          field: 'source',
          code: 'INVALID_ASSET_CODE',
          message: 'Use 1-12 letters or numbers.',
        };
      }
      return null;
    },
  },
  {
    field: 'dest',
    validate: (values: QuoteFormValues): QuoteFieldError | null => {
      const normalized = normalizeAssetCode(values.dest);
      if (!normalized) {
        return {
          field: 'dest',
          code: 'INVALID_ASSET_CODE',
          message: 'Use 1-12 letters or numbers.',
        };
      }
      const normalizedSource = normalizeAssetCode(values.source);
      if (
        normalizedSource &&
        normalized.toUpperCase() === normalizedSource.toUpperCase()
      ) {
        return {
          field: 'dest',
          code: 'ASSETS_MUST_DIFFER',
          message: 'Source and destination assets must differ.',
        };
      }
      return null;
    },
  },
  {
    field: 'amount',
    validate: (values: QuoteFormValues): QuoteFieldError | null => {
      if (!isValidAmount(values.amount)) {
        return {
          field: 'amount',
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive integer (base units).',
        };
      }
      return null;
    },
  },
];

/**
 * Validates a single field within the form context.
 */
export function validateQuoteField(
  field: QuoteFormField,
  values: QuoteFormValues,
  schema?: readonly QuoteFieldValidator[]
): QuoteFieldError | null {
  const activeSchema = schema ?? QUOTE_FORM_SCHEMA;
  const validator = activeSchema.find((v) => v.field === field);
  return validator ? validator.validate(values) : null;
}

/**
 * Validates all fields in the swap form according to the schema.
 * Returns structured errors, field mappings, and the first invalid field identifier.
 */
export function validateQuoteForm(
  values: QuoteFormValues,
  schema?: readonly QuoteFieldValidator[]
): QuoteValidationResult {
  const activeSchema = schema ?? QUOTE_FORM_SCHEMA;
  const errors: QuoteFieldError[] = [];
  const fieldErrors: Partial<Record<QuoteFormField, string>> = {};

  for (const validator of activeSchema) {
    const error = validator.validate(values);
    if (error) {
      errors.push(error);
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = error.message;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
    firstInvalidField: errors.length > 0 ? errors[0].field : null,
  };
}

/**
 * Formats a concise screen-reader accessible summary of current validation errors.
 */
export function formatValidationSummaryAnnouncement(
  errors: readonly QuoteFieldError[]
): string {
  if (errors.length === 0) {
    return '';
  }
  const count = errors.length;
  const countPrefix = `${count} error${count === 1 ? '' : 's'} found`;
  const fields = errors.map((err) => QUOTE_FIELD_LABELS[err.field]).join(', ');
  return `${countPrefix}: ${fields}.`;
}

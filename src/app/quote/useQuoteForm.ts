'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  validateQuoteForm,
  validateQuoteField,
  type QuoteFormField,
  type QuoteFormValues,
  type QuoteFieldError,
} from './quoteSchema';

export interface UseQuoteFormOptions {
  initialValues?: Partial<QuoteFormValues>;
  onValidSubmit: (values: QuoteFormValues) => void | Promise<void>;
}

/**
 * Custom hook managing swap quote form state, validation, focus management,
 * and accessible live region announcements (#727).
 */
export function useQuoteForm({
  initialValues,
  onValidSubmit,
}: UseQuoteFormOptions) {
  const [values, setValues] = useState<QuoteFormValues>({
    source: initialValues?.source ?? '',
    dest: initialValues?.dest ?? '',
    amount: initialValues?.amount ?? '',
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<QuoteFormField, string>>
  >({});
  const [schemaErrors, setSchemaErrors] = useState<QuoteFieldError[]>([]);
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);

  // Field element refs to manage focus on submit
  const sourceRef = useRef<HTMLInputElement>(null);
  const destRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const fieldRefs: Record<
    QuoteFormField,
    React.RefObject<HTMLInputElement | null>
  > = useMemo(
    () => ({
      source: sourceRef,
      dest: destRef,
      amount: amountRef,
    }),
    []
  );

  const focusField = useCallback(
    (field: QuoteFormField) => {
      const targetRef = fieldRefs[field];
      if (targetRef && targetRef.current) {
        targetRef.current.focus();
      } else {
        const el = document.getElementById(field);
        if (el) el.focus();
      }
    },
    [fieldRefs]
  );

  /**
   * Updates a field value and clears or revalidates its error as user edits.
   */
  const setFieldValue = useCallback(
    (field: QuoteFormField, value: string) => {
      setValues((prev) => {
        const nextValues = { ...prev, [field]: value };

        // If this field currently has an error, re-validate to see if it is resolved
        if (fieldErrors[field]) {
          const fieldError = validateQuoteField(field, nextValues);
          if (!fieldError) {
            // Error cleared!
            setFieldErrors((currErrors) => {
              const nextErrors = { ...currErrors };
              delete nextErrors[field];
              return nextErrors;
            });
            setSchemaErrors((currSchemaErrors) =>
              currSchemaErrors.filter((e) => e.field !== field)
            );
            setIsSubmitAttempted(false);
          } else {
            // Update message if changed
            setFieldErrors((currErrors) => ({
              ...currErrors,
              [field]: fieldError.message,
            }));
            setSchemaErrors((currSchemaErrors) =>
              currSchemaErrors.map((e) => (e.field === field ? fieldError : e))
            );
          }
        }

        // Special handling: if dest had an ASSETS_MUST_DIFFER error and user changed source
        if (field === 'source' && fieldErrors.dest) {
          const destError = validateQuoteField('dest', nextValues);
          if (!destError) {
            setFieldErrors((currErrors) => {
              const nextErrors = { ...currErrors };
              delete nextErrors.dest;
              return nextErrors;
            });
            setSchemaErrors((currSchemaErrors) =>
              currSchemaErrors.filter((e) => e.field !== 'dest')
            );
            setIsSubmitAttempted(false);
          }
        }

        return nextValues;
      });
    },
    [fieldErrors]
  );

  const swapAssets = useCallback(() => {
    setValues((prev) => {
      const swapped = {
        ...prev,
        source: prev.dest,
        dest: prev.source,
      };

      // Revalidate source and dest with swapped values
      const sourceError = validateQuoteField('source', swapped);
      const destError = validateQuoteField('dest', swapped);

      setFieldErrors((prevErrors) => {
        const next = { ...prevErrors };
        if (!sourceError) delete next.source;
        else next.source = sourceError.message;

        if (!destError) delete next.dest;
        else next.dest = destError.message;
        return next;
      });

      setSchemaErrors((prevErrors) => {
        const filtered = prevErrors.filter(
          (e) => e.field !== 'source' && e.field !== 'dest'
        );
        if (sourceError) filtered.push(sourceError);
        if (destError) filtered.push(destError);
        return filtered;
      });

      setIsSubmitAttempted(false);
      return swapped;
    });
  }, []);

  const resetErrors = useCallback(() => {
    setFieldErrors({});
    setSchemaErrors([]);
    setIsSubmitAttempted(false);
  }, []);

  const applyValues = useCallback((newValues: QuoteFormValues) => {
    setValues(newValues);
    setFieldErrors({});
    setSchemaErrors([]);
    setIsSubmitAttempted(false);
  }, []);

  const handleSubmit = useCallback(
    (event?: React.FormEvent) => {
      if (event) {
        event.preventDefault();
      }

      const result = validateQuoteForm(values);

      if (!result.isValid) {
        setFieldErrors(result.fieldErrors);
        setSchemaErrors(result.errors);
        setIsSubmitAttempted(true);

        if (result.firstInvalidField) {
          focusField(result.firstInvalidField);
        }
        return false;
      }

      // All fields valid
      setFieldErrors({});
      setSchemaErrors([]);
      setIsSubmitAttempted(false);
      onValidSubmit(values);
      return true;
    },
    [values, focusField, onValidSubmit]
  );

  return {
    values,
    setValues,
    setFieldValue,
    swapAssets,
    applyValues,
    fieldErrors,
    schemaErrors,
    isSubmitAttempted,
    handleSubmit,
    resetErrors,
    sourceRef,
    destRef,
    amountRef,
  };
}

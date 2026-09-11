import { renderHook, act } from '@testing-library/react';
import { useQuoteForm } from './useQuoteForm';

describe('useQuoteForm', () => {
  it('initializes with provided or default values', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: 'USDC', dest: 'EURC', amount: '100' },
        onValidSubmit,
      })
    );

    expect(result.current.values).toEqual({
      source: 'USDC',
      dest: 'EURC',
      amount: '100',
    });
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.schemaErrors).toHaveLength(0);
    expect(result.current.isSubmitAttempted).toBe(false);
  });

  it('blocks submission when fields are invalid and focuses the first invalid field', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: '', dest: '', amount: '' },
        onValidSubmit,
      })
    );

    // Mock focus on the sourceRef input
    const mockFocus = jest.fn();
    (result.current.sourceRef as any).current = { focus: mockFocus };

    act(() => {
      const success = result.current.handleSubmit();
      expect(success).toBe(false);
    });

    expect(onValidSubmit).not.toHaveBeenCalled();
    expect(result.current.isSubmitAttempted).toBe(true);
    expect(result.current.schemaErrors).toHaveLength(3);
    expect(result.current.fieldErrors.source).toBe(
      'Use 1-12 letters or numbers.'
    );
    expect(result.current.fieldErrors.dest).toBe(
      'Use 1-12 letters or numbers.'
    );
    expect(result.current.fieldErrors.amount).toBe(
      'Amount must be a positive integer (base units).'
    );
    expect(mockFocus).toHaveBeenCalledTimes(1);
  });

  it('clears an individual field error as user fixes that field', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: {
          source: 'INVALID!',
          dest: 'EURC',
          amount: '1000',
        },
        onValidSubmit,
      })
    );

    // Trigger validation
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.fieldErrors.source).toBe(
      'Use 1-12 letters or numbers.'
    );
    expect(result.current.schemaErrors).toHaveLength(1);

    // User types valid source asset
    act(() => {
      result.current.setFieldValue('source', 'USDC');
    });

    expect(result.current.fieldErrors.source).toBeUndefined();
    expect(result.current.schemaErrors).toHaveLength(0);
    expect(result.current.isSubmitAttempted).toBe(false);
  });

  it('clears dest asset error when source asset changes so they no longer match', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: 'USDC', dest: 'USDC', amount: '1000' },
        onValidSubmit,
      })
    );

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.fieldErrors.dest).toBe(
      'Source and destination assets must differ.'
    );

    // User changes source asset to EURC
    act(() => {
      result.current.setFieldValue('source', 'EURC');
    });

    expect(result.current.fieldErrors.dest).toBeUndefined();
    expect(result.current.schemaErrors).toHaveLength(0);
  });

  it('submits successfully and calls onValidSubmit when all fields are valid', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: 'USDC', dest: 'EURC', amount: '1000' },
        onValidSubmit,
      })
    );

    act(() => {
      const success = result.current.handleSubmit();
      expect(success).toBe(true);
    });

    expect(onValidSubmit).toHaveBeenCalledWith({
      source: 'USDC',
      dest: 'EURC',
      amount: '1000',
    });
    expect(result.current.isSubmitAttempted).toBe(false);
  });

  it('swaps source and destination and revalidates properly', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: 'USDC', dest: 'EURC', amount: '500' },
        onValidSubmit,
      })
    );

    act(() => {
      result.current.swapAssets();
    });

    expect(result.current.values.source).toBe('EURC');
    expect(result.current.values.dest).toBe('USDC');
    expect(result.current.fieldErrors).toEqual({});
  });

  it('applies values from history and resets errors', () => {
    const onValidSubmit = jest.fn();
    const { result } = renderHook(() =>
      useQuoteForm({
        initialValues: { source: '', dest: '', amount: '' },
        onValidSubmit,
      })
    );

    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.schemaErrors.length).toBeGreaterThan(0);

    act(() => {
      result.current.applyValues({
        source: 'DAI',
        dest: 'USDT',
        amount: '2000',
      });
    });

    expect(result.current.values).toEqual({
      source: 'DAI',
      dest: 'USDT',
      amount: '2000',
    });
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.schemaErrors).toHaveLength(0);
    expect(result.current.isSubmitAttempted).toBe(false);
  });
});

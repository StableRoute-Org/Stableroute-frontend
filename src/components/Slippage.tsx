import { memo, useState, useCallback, useMemo, type ChangeEvent } from 'react';

export type SlippageStatus = 'idle' | 'loading' | 'empty' | 'error' | 'success';

export interface SlippageProps {
  /** Current slippage value in percentage (e.g. 0.5 for 0.5%) */
  value?: number;
  /** Callback triggered when slippage value changes */
  onChange?: (value: number) => void;
  /** Preset percentage options to display. Defaults to [0.1, 0.5, 1.0] */
  options?: number[];
  /** Operational status of the slippage control. Defaults to 'idle' */
  status?: SlippageStatus;
  /** Custom status description or error message */
  message?: string;
  /** Callback triggered when user clicks retry button in error state */
  onRetry?: () => void;
  /** Minimum custom slippage percentage allowed. Defaults to 0.01 */
  min?: number;
  /** Maximum custom slippage percentage allowed. Defaults to 50 */
  max?: number;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

const DEFAULT_OPTIONS = [0.1, 0.5, 1.0];
const DEFAULT_MIN = 0.01;
const DEFAULT_MAX = 50.0;

function SlippageBase({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  status = 'idle',
  message,
  onRetry,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  disabled = false,
  className = '',
}: SlippageProps) {
  const [customValue, setCustomValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handlePresetSelect = useCallback(
    (preset: number) => {
      if (disabled || status === 'loading') return;
      setCustomValue('');
      setInputError(null);
      onChange?.(preset);
    },
    [disabled, status, onChange]
  );

  const handleCustomChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const valStr = e.target.value;
      setCustomValue(valStr);

      if (valStr.trim() === '') {
        setInputError(null);
        return;
      }

      const parsed = parseFloat(valStr);
      if (isNaN(parsed)) {
        setInputError('Please enter a valid number.');
      } else if (parsed < min) {
        setInputError(`Minimum slippage is ${min}%.`);
      } else if (parsed > max) {
        setInputError(`Maximum slippage is ${max}%.`);
      } else {
        setInputError(null);
        onChange?.(parsed);
      }
    },
    [min, max, onChange]
  );

  const isPresetActive = useCallback(
    (preset: number) => {
      return customValue === '' && value === preset;
    },
    [customValue, value]
  );

  const presetButtons = useMemo(() => {
    return options.map((preset) => {
      const active = isPresetActive(preset);
      return (
        <button
          key={preset}
          type="button"
          aria-pressed={active}
          disabled={disabled || status === 'loading'}
          onClick={() => handlePresetSelect(preset)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            active
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
          } ${
            disabled || status === 'loading'
              ? 'cursor-not-allowed opacity-50'
              : ''
          }`}
        >
          {preset}%
        </button>
      );
    });
  }, [options, isPresetActive, disabled, status, handlePresetSelect]);

  return (
    <div
      data-testid="slippage-container"
      className={`flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 ${className}`}
    >
      <div className="flex items-center justify-between">
        <label
          htmlFor="slippage-custom-input"
          className="text-sm font-medium text-neutral-900 dark:text-neutral-100"
        >
          Slippage Tolerance
        </label>
        {status === 'loading' && (
          <span
            role="status"
            aria-live="polite"
            data-testid="slippage-loading"
            className="text-xs text-neutral-500 dark:text-neutral-400"
          >
            Updating...
          </span>
        )}
      </div>

      {status === 'empty' && (
        <div
          role="status"
          aria-live="polite"
          data-testid="slippage-empty"
          className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400"
        >
          {message || 'No slippage options available.'}
        </div>
      )}

      {status === 'error' && (
        <div
          role="alert"
          data-testid="slippage-error"
          className="flex items-center justify-between gap-2 rounded-md bg-danger-50 p-3 text-sm text-danger-800 dark:bg-danger-950/50 dark:text-danger-300"
        >
          <span>{message || 'Failed to calculate slippage.'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded px-2 py-1 text-xs font-semibold text-danger-700 hover:bg-danger-100 dark:text-danger-200 dark:hover:bg-danger-900"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {status !== 'empty' && status !== 'error' && (
        <div className="flex flex-wrap items-center gap-2">
          {presetButtons}

          <div className="relative flex items-center">
            <input
              id="slippage-custom-input"
              type="text"
              inputMode="decimal"
              placeholder="Custom"
              value={customValue}
              disabled={disabled || status === 'loading'}
              onChange={handleCustomChange}
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'slippage-input-error' : undefined}
              className={`w-24 rounded-md border px-2.5 py-1 text-xs focus:outline-none focus:ring-2 ${
                inputError
                  ? 'border-danger-500 focus:ring-danger-500'
                  : 'border-neutral-300 focus:ring-neutral-400 dark:border-neutral-700'
              } bg-transparent text-neutral-900 dark:text-neutral-100 ${
                disabled || status === 'loading'
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
            />
            <span className="ml-1 text-xs text-neutral-500 dark:text-neutral-400">
              %
            </span>
          </div>
        </div>
      )}

      {inputError && (
        <p
          id="slippage-input-error"
          role="alert"
          className="text-xs text-danger-600 dark:text-danger-400"
        >
          {inputError}
        </p>
      )}

      {status === 'success' && message && (
        <p
          role="status"
          aria-live="polite"
          className="text-xs text-success-600 dark:text-success-400"
        >
          {message}
        </p>
      )}
    </div>
  );
}

function arePropsEqual(prevProps: SlippageProps, nextProps: SlippageProps): boolean {
  if (
    prevProps.value !== nextProps.value ||
    prevProps.status !== nextProps.status ||
    prevProps.message !== nextProps.message ||
    prevProps.min !== nextProps.min ||
    prevProps.max !== nextProps.max ||
    prevProps.disabled !== nextProps.disabled ||
    prevProps.className !== nextProps.className ||
    prevProps.onChange !== nextProps.onChange ||
    prevProps.onRetry !== nextProps.onRetry
  ) {
    return false;
  }

  if (prevProps.options === nextProps.options) {
    return true;
  }

  if (!prevProps.options || !nextProps.options) {
    return prevProps.options === nextProps.options;
  }

  if (prevProps.options.length !== nextProps.options.length) {
    return false;
  }

  for (let i = 0; i < prevProps.options.length; i++) {
    if (prevProps.options[i] !== nextProps.options[i]) {
      return false;
    }
  }

  return true;
}

export const Slippage = memo(SlippageBase, arePropsEqual);


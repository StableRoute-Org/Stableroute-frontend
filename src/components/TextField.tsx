import { type InputHTMLAttributes, type ReactNode, useId } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
};

export function TextField({
  label,
  description,
  error,
  className = "",
  id,
  ...rest
}: Props) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errId = error ? `${inputId}-err` : undefined;
  return (
    <div className={`flex flex-col gap-1 text-sm ${className}`}>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-describedby={[descId, errId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? true : undefined}
        className="rounded-md border border-neutral-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        {...rest}
      />
      {description && (
        <span id={descId} className="text-xs text-neutral-500">
          {description}
        </span>
      )}
      {error && (
        <span id={errId} role="alert" className="text-xs text-rose-600">
          {error}
        </span>
      )}
    </div>
  );
}

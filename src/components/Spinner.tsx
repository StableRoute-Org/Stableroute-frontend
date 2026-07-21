type Props = { label?: string };

export function Spinner({ label = 'Loading' }: Props) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm">
      <svg
        aria-hidden="true"
        className="h-4 w-4 animate-spin"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          opacity="0.25"
        />
        <path
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

import { type ReactNode } from "react";
import { Badge } from "./Badge";

type Trend = "up" | "down" | "flat";

export type Trend = "up" | "down" | "flat";

type Props = {
  label: ReactNode;
  value: ReactNode;
  /**
   * Numeric change since the previous measurement. When provided, the
   * tile renders a coloured delta indicator. The colour is never the
   * only signal — the arrow character + an `aria-label` (or visible
   * "+x.x%") carry the same information for screen-reader users and
   * users with colour-vision differences.
   *
   * Mutually exclusive with `trend`: pass one or the other, not both.
   */
  delta?: number;
  /**
   * Pre-computed direction. Use this when the change is categorical
   * rather than numeric (e.g. "0 events → 1 event" is `up`). Mutually
   * exclusive with `delta`.
   */
  trend?: Trend;
  /**
   * Optional unit for the delta. Rendered as a suffix to the delta
   * text (e.g. `+12.3%` or `-3 /s`). Defaults to the empty string.
   */
  deltaUnit?: string;
  /**
   * Optional formatter for the numeric delta. Defaults to
   * `Math.abs(value).toFixed(1)` (one decimal place, no sign).
   */
  formatDelta?: (value: number) => string;
};

function defaultFormat(value: number): string {
  return Math.abs(value).toFixed(1);
}

function trendFromDelta(delta: number | undefined): Trend | undefined {
  if (delta === undefined) return undefined;
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

const TREND_STYLES: Record<Trend, { color: string; arrow: string; label: string }> = {
  up: { color: "text-emerald-600 dark:text-emerald-400", arrow: "▲", label: "increased" },
  down: { color: "text-rose-600 dark:text-rose-400", arrow: "▼", label: "decreased" },
  flat: { color: "text-neutral-500 dark:text-neutral-400", arrow: "▬", label: "unchanged" },
};

export function StatTile({
  label,
  value,
  delta,
  trend,
  deltaUnit = "",
  formatDelta = defaultFormat,
}: Props) {
  const direction = trend ?? trendFromDelta(delta);
  const indicator = direction ? TREND_STYLES[direction] : undefined;
  // The visible text is the operator-readable delta (e.g. "+12.3%"); the
  // aria-label is the full human sentence so screen-reader users get
  // direction, magnitude, and unit without seeing the arrow character.
  const visibleText = indicator
    ? `${direction === "up" ? "+" : direction === "down" ? "-" : ""}${delta !== undefined ? formatDelta(delta) : ""}${deltaUnit}`
    : "";
  const ariaLabel = indicator
    ? `${label?.toString() ?? ""} ${indicator.label}${delta !== undefined ? ` by ${formatDelta(delta)}${deltaUnit}` : ""}`.trim()
    : undefined;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold">
        {value}
        {indicator && (
          <span
            className={`ml-2 inline-flex items-baseline text-sm font-medium ${indicator.color}`}
            aria-label={ariaLabel}
          >
            <span aria-hidden="true" className="mr-0.5">
              {indicator.arrow}
            </span>
            <span>{visibleText}</span>
          </span>
        )}
      </dd>
    </div>
  );
}

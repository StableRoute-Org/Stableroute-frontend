import { type ReactNode } from "react";
import { Badge } from "./Badge";

type Trend = "up" | "down" | "flat";

type Props = {
  label: ReactNode;
  value: ReactNode;
  delta?: number;
  trend?: Trend;
};

const trendFromDelta = (delta: number): Trend => {
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
};

const trendCopy: Record<Trend, { label: string; variant: "neutral" | "ok" | "danger" }> = {
  up: { label: "Up", variant: "ok" },
  down: { label: "Down", variant: "danger" },
  flat: { label: "Flat", variant: "neutral" },
};

const signedDelta = (trend: Trend, delta: number): string => {
  const magnitude = Math.abs(delta).toString();
  if (trend === "up") return `+${magnitude}`;
  if (trend === "down") return `-${magnitude}`;
  return "0";
};

export function StatTile({ label, value, delta, trend }: Props) {
  const resolvedTrend = trend ?? (delta !== undefined ? trendFromDelta(delta) : undefined);
  const trendMeta = resolvedTrend ? trendCopy[resolvedTrend] : undefined;
  const visualDelta =
    resolvedTrend && delta !== undefined ? signedDelta(resolvedTrend, delta) : undefined;

  return (
    <div className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 flex flex-col items-center gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        {resolvedTrend && trendMeta && (
          <Badge variant={trendMeta.variant}>
            <span aria-hidden="true">
              {trendMeta.label}
              {visualDelta ? ` ${visualDelta}` : ""}
            </span>
            <span className="sr-only">
              Trend {resolvedTrend}
              {visualDelta ? ` by ${Math.abs(delta ?? 0)}` : ""}
            </span>
          </Badge>
        )}
      </dd>
    </div>
  );
}

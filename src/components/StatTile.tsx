import { type ReactNode } from "react";

type Props = {
  label: ReactNode;
  value: ReactNode;
  /** Optional signed delta shown beside the value (e.g. +12%). */
  trend?: ReactNode;
  trendDirection?: "up" | "down" | "neutral";
};

const trendClass: Record<NonNullable<Props["trendDirection"]>, string> = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-rose-600 dark:text-rose-400",
  neutral: "text-neutral-500",
};

export function StatTile({ label, value, trend, trendDirection = "neutral" }: Props) {
  return (
    <div data-stattile className="rounded-lg border border-neutral-200 p-4 text-center dark:border-neutral-800">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{label}</dt>
      <dd className="mt-1 flex items-baseline justify-center gap-2 text-2xl font-semibold">
        <span>{value}</span>
        {trend !== undefined && (
          <span className={`text-sm font-medium ${trendClass[trendDirection]}`}>{trend}</span>
        )}
      </dd>
    </div>
  );
}

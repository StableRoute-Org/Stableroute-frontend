import React, { memo } from 'react';

export type QuoteInputs = {
  source: string;
  dest: string;
  amount: string;
};

export type HistoryEntry = QuoteInputs & { savedAt: number };

export interface QuoteHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}

export const QuoteHistory = memo(function QuoteHistory({
  history,
  onSelect,
}: QuoteHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recent-quotes-heading"
      className="flex flex-col gap-2"
    >
      <h2 id="recent-quotes-heading" className="text-sm font-medium">
        Recent quotes
      </h2>
      <ul className="flex flex-col gap-1">
        {history.map((entry) => (
          <li
            key={`${entry.source}-${entry.dest}-${entry.amount}-${entry.savedAt}`}
          >
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="w-full rounded border border-neutral-200 px-3 py-2 text-left text-sm hover:border-neutral-400 dark:border-neutral-800"
            >
              {entry.source} → {entry.dest} · {entry.amount}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
});

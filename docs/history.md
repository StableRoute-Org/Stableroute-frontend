# Quote History (`QuoteHistory`)

The `QuoteHistory` component renders a list of recently requested currency routing path quotes persisted in `localStorage`. Clicking a history item applies its saved inputs (`source`, `dest`, `amount`) back into the quote form.

The component is memoized (`React.memo`) so stable prop references prevent unnecessary re-renders when parent form inputs, loading state, or error messages update.

## Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `history` | `HistoryEntry[]` | Yes | List of recently saved quote input entries. |
| `onSelect` | `(entry: HistoryEntry) => void` | Yes | Callback invoked when a user clicks a history button to select an entry. |

## Types

```typescript
export type QuoteInputs = {
  source: string;
  dest: string;
  amount: string;
};

export type HistoryEntry = QuoteInputs & {
  savedAt: number; // Unix timestamp in milliseconds when saved
};

export interface QuoteHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
}
```

## Behavior & Rendering Contract

- **Empty State** — If `history` is empty (`history.length === 0`), `QuoteHistory` renders `null`.
- **Item Display** — Each entry is rendered as a full-width button displaying `{entry.source} → {entry.dest} · {entry.amount}`.
- **Memoization** — Wrapped with `React.memo`. Re-renders only when `history` array reference or `onSelect` function reference changes.
- **Persistence** — Quotes are stored in `localStorage` under `stableroute.quote.history`, limited to a maximum of 5 entries. Duplicate entries are deduplicated on push.

## Usage Example

```tsx
import { QuoteHistory, HistoryEntry } from './QuoteHistory';
import { useCallback, useState } from 'react';

function QuoteContainer() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    // Populate form fields with selected history item
    setSourceAsset(entry.source);
    setDestAsset(entry.dest);
    setAmount(entry.amount);
  }, []);

  return (
    <QuoteHistory
      history={history}
      onSelect={handleSelectHistory}
    />
  );
}
```

## Accessibility

- Wrapped in a `<section>` element linked to the section title via `aria-labelledby="recent-quotes-heading"`.
- Uses semantic `<h2>` with ID `recent-quotes-heading`.
- Interactive items are rendered as semantic `<button type="button">` elements with explicit type attributes to avoid accidental form submission.

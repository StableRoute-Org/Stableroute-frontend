# Tooltips

The `Tooltip` component renders a trigger element plus a status surface that reflects one of four mutually-exclusive states: `loading`, `empty`, `error`, and `success`. The trigger always renders; the status text changes with the `status` prop and is exposed to assistive technology via `role="status"` and `aria-live="polite"`.

The component is memoized (`React.memo`) so stable props prevent needless re-renders of the trigger subtree.

## Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `status` | `'loading' \| 'empty' \| 'error' \| 'success'` | Yes | Drives which status label is shown. States are mutually exclusive. |
| `message` | `string` | No | Extra detail appended to the status label (e.g. an error description). |
| `children` | `ReactNode` | Yes | The trigger / content the tooltip is attached to. |

## States

- **Loading** — renders "Loading" while async work is in flight.
- **Empty** — renders "No data" when there is nothing to show.
- **Error** — renders "Error" plus the `message` (if provided).
- **Success** — renders "Ready".

Only one status label is present at a time; the previous label is replaced, never stacked.

## Usage

```tsx
import { Tooltip } from '@/components/Tooltip';

<Tooltip status="success" message="Saved">
  <button>Save</button>
</Tooltip>

<Tooltip status="error" message="Failed to load">
  <button>Retry</button>
</Tooltip>
```

## Accessibility

- The status surface has `role="status"` and `aria-live="polite"`, so screen readers announce state changes without interrupting the user.
- The tooltip is visually hidden from pointer events (`pointer-events-none`) so it does not block interaction with the trigger.

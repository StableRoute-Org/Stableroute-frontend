# Slippage Tolerance

The `Slippage` component provides an accessible, reusable interface for viewing and configuring slippage tolerance settings in path routing quotes. It supports preset options (e.g. `0.1%`, `0.5%`, `1.0%`), custom percentage inputs with validation boundaries, operational status states (`idle`, `loading`, `empty`, `error`, `success`), and an integrated retry mechanism.

The component is memoized (`React.memo`) to prevent unnecessary re-renders when parent components re-render with unchanged props.

## Props

| Prop | Type | Required | Default | Notes |
|---|---|---|---|---|
| `value` | `number` | No | `undefined` | Current slippage tolerance percentage value (e.g. `0.5` for 0.5%). |
| `onChange` | `(value: number) => void` | No | `undefined` | Callback invoked when a preset option is selected or a valid custom percentage is entered. |
| `options` | `number[]` | No | `[0.1, 0.5, 1.0]` | Array of preset percentage values displayed as quick selection buttons. |
| `status` | `'idle' \| 'loading' \| 'empty' \| 'error' \| 'success'` | No | `'idle'` | Operational status of the component. Drives loading indicators, empty states, or error notices. |
| `message` | `string` | No | `undefined` | Text message displayed in `empty`, `error`, or `success` states (e.g. error detail or confirmation text). |
| `onRetry` | `() => void` | No | `undefined` | Callback invoked when the user clicks the "Retry" button in the `error` state. |
| `min` | `number` | No | `0.01` | Minimum custom slippage percentage allowed. |
| `max` | `number` | No | `50.0` | Maximum custom slippage percentage allowed. |
| `disabled` | `boolean` | No | `false` | When `true`, disables all preset buttons and the custom input field. |
| `className` | `string` | No | `''` | Custom CSS class names merged with the container container element. |

## Operational States

- **`idle`** — Standard interactive mode. Preset buttons and custom input field are enabled and active.
- **`loading`** — Displays an accessible "Updating..." status indicator (`role="status"`, `aria-live="polite"`). Interactive controls are temporarily disabled to prevent race conditions during async quote re-calculation.
- **`empty`** — Renders a neutral placeholder banner (`role="status"`) when no slippage options are available. Preset buttons and custom input are hidden.
- **`error`** — Displays a prominent error banner (`role="alert"`) with the error `message`. If `onRetry` is provided, a "Retry" button is rendered to trigger recovery.
- **`success`** — Standard interactive mode with an optional helper message displayed below the input in green text (`role="status"`).

## Custom Input & Validation

Users can enter a custom slippage tolerance percentage in the text field. The component validates input in real time:

- **Invalid numbers**: Displays `"Please enter a valid number."` as a field error (`role="alert"`).
- **Below minimum bound**: Displays `"Minimum slippage is <min>%."` if the entered value is lower than `min`.
- **Above maximum bound**: Displays `"Maximum slippage is <max>%."` if the entered value exceeds `max`.
- Valid custom inputs trigger `onChange(parsedNumber)`.
- Input fields use `aria-invalid="true"` and `aria-describedby` when a validation error is active.

## Usage Examples

### Basic Usage

```tsx
import { useState } from 'react';
import { Slippage } from '@/components/Slippage';

export function QuoteSlippageConfig() {
  const [slippage, setSlippage] = useState<number>(0.5);

  return (
    <Slippage
      value={slippage}
      onChange={(newValue) => setSlippage(newValue)}
    />
  );
}
```

### Custom Presets & Validation Bounds

```tsx
import { Slippage } from '@/components/Slippage';

<Slippage
  value={1.0}
  options={[0.1, 0.5, 1.0, 2.0, 5.0]}
  min={0.05}
  max={20.0}
  onChange={(val) => console.log('Selected slippage:', val)}
/>
```

### Async Loading, Error & Retry Handling

```tsx
import { Slippage, type SlippageStatus } from '@/components/Slippage';

export function ManagedSlippage({ status, errorMessage, refetch }: {
  status: SlippageStatus;
  errorMessage?: string;
  refetch: () => void;
}) {
  return (
    <Slippage
      status={status}
      message={errorMessage}
      onRetry={refetch}
      onChange={(val) => updateQuoteSlippage(val)}
    />
  );
}
```

## Accessibility

- **Labeling**: The custom input is linked to the "Slippage Tolerance" `<label>` via `htmlFor`.
- **ARIA Pressed**: Preset buttons use `aria-pressed="true"` for the currently selected active preset.
- **Live Regions**: Status messages utilize `role="status"` and `aria-live="polite"` for non-disruptive announcements, while errors use `role="alert"`.
- **Validation Wiring**: Custom input errors trigger `aria-invalid="true"` and link to the error element via `aria-describedby`.
- **Reduced Motion**: Styled with native Tailwind CSS states, ensuring smooth rendering without motion dependency.

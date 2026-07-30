# Forms

The `TextField` component is the shared form input used across the app — handles labeling, description text, error states, and accessibility wiring in one place.

## Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `label` | `ReactNode` | Yes | Rendered as the associated `<label>` |
| `description` | `ReactNode` | No | Helper text shown below the input |
| `error` | `ReactNode` | No | Error text shown below the input; sets `aria-invalid` and `role="alert"` on the message |
| `id` | `string` | No | Falls back to an auto-generated React `useId()` value if omitted |
| `className` | `string` | No | Merged into the wrapper's classes |
| ...rest | `InputHTMLAttributes<HTMLInputElement>` | No | All standard input attributes (`value`, `onChange`, `type`, `placeholder`, etc.) are passed through |

## States

- **Default** — label + input, no description or error
- **With description** — helper text rendered below the input, linked via `aria-describedby`
- **With error** — error text rendered below the input in red, linked via `aria-describedby`, input marked `aria-invalid="true"`, error text has `role="alert"` for screen readers

## Usage

```tsx
import { TextField } from '@/components/TextField';

<TextField
  label="Email address"
  description="We'll never share this with anyone."
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
<TextField
  label="Email address"
  error="Please enter a valid email address."
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
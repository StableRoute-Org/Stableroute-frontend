# Help Component Contract

The [`Help`](../src/components/Help.tsx) component is a contextual help surface
that renders a trigger/content subtree alongside a status readout. Its async
updates are announced to assistive technology through a dedicated **polite live
region**, so screen-reader users are not left guessing whether help copy has
finished loading, is unavailable, or is ready to read.

The component is memoized (`React.memo`) so stable props prevent needless
re-renders of the trigger subtree.

## Component & Exports

`src/components/Help.tsx` exports:

| Export       | Kind        | Description                                                            |
| ------------ | ----------- | ---------------------------------------------------------------------- |
| `Help`       | Component   | Memoized contextual help surface (the default UI component).           |
| `HelpStatus` | Type        | Union of the four mutually-exclusive render states the component accepts. |

## Props

| Prop        | Type                                  | Required | Default | Description                                                                                                                            |
| ----------- | ------------------------------------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `status`    | `HelpStatus`                          | Yes      | —       | Mutually-exclusive render state. Drives which status message is shown.                                                                 |
| `message`   | `string`                              | No       | —       | Extra detail appended to the current status label (e.g. error detail, empty hint). Omitted entirely when not provided.                 |
| `children`  | `ReactNode`                           | Yes      | —       | The trigger/content element the help affordance is attached to. Always renders regardless of status.                                   |
| `debounceMs`| `number`                              | No       | `300`   | Debounce window (ms) for the live-region announcement. Rapid status changes are coalesced so the last one wins. Set to `0` for immediate announcement. |

### Types

```typescript
export type HelpStatus = 'loading' | 'empty' | 'error' | 'success';
```

The `HelpStatus` type is exported from `src/components/Help.tsx` so callers can
type their state without hardcoding the union.

## Status model

`Help` accepts one of four mutually-exclusive statuses via the `status` prop:

| Status    | Visible label    | Announced prefix |
| --------- | ---------------- | ---------------- |
| `loading` | Loading help…    | Loading help…    |
| `empty`   | No help available | No help available |
| `error`   | Help unavailable | Help unavailable |
| `success` | Help ready       | Help ready       |

An optional `message` string is appended to both the visible label and the
announcement (e.g. `Help unavailable: Network error`). If omitted, no trailing
segment is rendered or announced.

## Minimal usage example

```tsx
import { Help, type HelpStatus } from '@/components/Help';

function HelpSurface({ status, error }: { status: HelpStatus; error?: string }) {
  return (
    <Help status={status} message={error} debounceMs={300}>
      <button type="button">Get help</button>
    </Help>
  );
}
```

## Behavior & rendering contract

- **Status readout** — the visible `<span role="status" aria-live="polite">`
  always renders and carries the current status label (plus `message` when
  provided). The previous label is replaced, never stacked.
- **Children** — the `children` subtree is rendered unconditionally, so the
  trigger remains interactive in every state.
- **Live announcement** — a separate `sr-only` region
  (`aria-live="polite"`, `aria-atomic="true"`) is populated **only when the
  status actually changes**, so screen readers hear the transition without the
  page re-reading the initial state on mount.
- **Debounce** — the announcement is written after `debounceMs` (default
  `300ms`). Rapid successive changes are coalesced — the last one wins. A
  pending timer is cancelled on re-render and on unmount.
- **Memoization** — wrapped with `React.memo`; re-renders only when prop
  references change.

## ARIA contract

The component exposes two complementary regions:

1. **Visible status text** — a `<span role="status" aria-live="polite">` that
   carries the current status label. This provides a live, visually-rendered
   status for sighted users while remaining a polite live region for
   assistive tech.
2. **Screen-reader-only announcement region** — a second `<span>` with
   `aria-live="polite"`, `aria-atomic="true"`, and the `sr-only` utility class.
   This region is populated **only when the status actually changes**, so
   screen readers hear the transition (e.g. "Help ready") without the page
   re-reading the initial state on mount.

## Debounce semantics

`Help` accepts a `debounceMs` prop (default **300ms**) that controls how long a
status change waits before it is written into the announcement region:

- Rapid successive status changes within the debounce window are coalesced —
  the **last one wins**.
- A pending timer is cancelled when the status changes again, when the effect
  re-runs, or when the component unmounts (preventing stale announcements).
- Setting `debounceMs` to `0` announces immediately (synchronous state writes).
- The initial mount is never announced: the previous-status ref is seeded with
  the initial status, so the first effect run sees "no change".

### Why a debounce?

Help copy can transition quickly through `loading → success` (or
`loading → error`) as a fetch resolves. Without coalescing, a screen reader
would be interrupted by a rapid string of announcements. Debouncing keeps the
announcement queue quiet and lets the final state win.

## Tests

Behaviour is covered in
[`src/components/__tests__/Help.test.tsx`](../src/components/__tests__/Help.test.tsx):

- Initial mount is **not** announced, even after the debounce window elapses.
- `loading → success`, `loading → error`, and `empty → success` transitions
  are announced with/without an optional message.
- Rapid successive updates coalesce (last one wins).
- Same-status re-renders are silent.
- Custom debounce windows and immediate (`debounceMs={0}`) announcements.
- `aria-live="polite"`, `aria-atomic="true"`, and `sr-only` are present on the
  announcement region.
- Pending debounced announcements are cancelled on unmount.

## Related documentation

- [Loading Region Accessibility](loading-regions.md)
- [Tooltips](tooltips.md)
- [Accessibility Conformance Statement](ACCESSIBILITY.md)


# Swap Interface Async State Machine (#725)

The swap interface manages asynchronous quote requests through a formal discriminated union state machine (`SwapAsyncState`), rendered via the mutually exclusive `SwapResultView` component.

## Architecture

Prior to this implementation, the quote client tracked async lifecycle across fragmented `useState` hooks (`loading`, `quote`, `formError`, `requestId`), creating potential race conditions, impossible visual combinations (e.g. stale quote cards lingering beneath error alerts or spinners), and fragmented accessibility announcements.

The solution introduces:
1. **`swapStateMachine.ts`**: Pure discriminated union model with predictable reducer transitions and standard error formatting.
2. **`SwapResultView.tsx`**: Presentational component providing guaranteed mutual exclusivity across states.
3. **`swapStateMachine.test.ts`**: Unit tests verifying state machine transitions and error formatting.
4. **`SwapResultView.test.tsx`**: Unit tests verifying rendering behavior and accessibility attributes.
5. **`swap-state-machine.integration.test.tsx`**: Full integration tests verifying state progression, edge cases, and error recovery via retry.

---

## State Machine Definition

### Discriminated Union: `SwapAsyncState`

```typescript
export type SwapAsyncState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'error'; message: string; requestId?: string }
  | { status: 'success'; quote: Quote };
```

### Action Types: `SwapAsyncAction`

```typescript
export type SwapAsyncAction =
  | { type: 'RESET' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; message: string; requestId?: string }
  | { type: 'SUBMIT_SUCCESS'; quote: Quote };
```

### Transition Table

| Current State | Action | Next State | Description |
|---|---|---|---|
| `*` | `RESET` | `empty` | Reverts view to empty placeholder (e.g. when selecting a new history pair). |
| `empty` | `error` | `success` | `SUBMIT_START` | `loading` | Dispatches on form submit or retry click. |
| `loading` | `SUBMIT_SUCCESS` | `success` | Stores canonical quote result. |
| `loading` | `SUBMIT_ERROR` | `error` | Captures message and optional request ID. |
| `*` | Unknown | Current | Preserves state if unhandled action is received. |

---

## Views & Mutual Exclusivity

`SwapResultView` renders exactly one state by construction using a switch statement:

- **`empty`**: Renders `[data-testid="swap-empty"]` instructing the user to enter quote parameters. No stale cards or loaders are rendered.
- **`loading`**: Renders `[data-testid="swap-loading"]` with `<Spinner label="Requesting quote…" />`, `role="status"`, `aria-live="polite"`, and `aria-busy="true"`.
- **`error`**: Renders `[data-testid="swap-error"]` containing an alert banner (`role="alert"`), optional request ID code block, and a primary "Retry quote" button calling `onRetry`.
- **`success`**: Renders `[data-testid="swap-success"]` with the routed assets, formatted amount, estimated rate, and slippage indicator.

---

## Accessibility (WCAG 2.1 AA)

- **Polite Live Regions**: The loading state informs screen readers via `aria-live="polite"` and `aria-busy="true"`.
- **Alert Announcements**: Error states use `role="alert"` to immediately inform users of failure.
- **Single Polite Status Role**: Deduplicated with companion elements so only one polite atomic status region is active per section.
- **Keyboard & Focus**: Retry buttons provide high-contrast visual focus rings (`focus-visible:outline-2 focus-visible:outline-offset-2`).

---

## Verification

Run all test suites for the quote module:

```bash
npm test -- src/app/quote --watchAll=false
npm run lint
npm run build
```

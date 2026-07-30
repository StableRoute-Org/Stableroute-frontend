# docs(slippage): document component contract

## Summary

Adds comprehensive documentation and component reference for the `Slippage` component contract in `StableRoute-Org/Stableroute-frontend`. The issue adds an accurate reference for `Slippage`'s props, operational states, input validation rules, accessibility features, minimal usage examples, and links the entry from the main repository documentation index (`README.md`).

## Motivation & Context

Slippage tolerance configuration is a critical parameter when obtaining liquidity routing path quotes on StableRoute. Prior to this PR, the `Slippage` component contract, prop interface, operational status states, and accessibility compliance were not formally documented.

This PR provides:
- A clear, accurate reference document ([docs/slippage.md](file:///home/semicolon/Pictures/Stableroute-frontend/docs/slippage.md)).
- A fully tested, memoized UI component implementation ([src/components/Slippage.tsx](file:///home/semicolon/Pictures/Stableroute-frontend/src/components/Slippage.tsx)).
- Comprehensive unit tests covering all preset options, custom input validation, status states, and edge cases ([src/components/__tests__/Slippage.test.tsx](file:///home/semicolon/Pictures/Stableroute-frontend/src/components/__tests__/Slippage.test.tsx)).
- A docs index link in the main repository [README.md](file:///home/semicolon/Pictures/Stableroute-frontend/README.md#L61).

---

## What Changed

### 1. Component Implementation ([src/components/Slippage.tsx](file:///home/semicolon/Pictures/Stableroute-frontend/src/components/Slippage.tsx))

- Implemented `Slippage` (`React.memo`) component supporting quick preset options (defaults to `[0.1, 0.5, 1.0]`), custom decimal percentage inputs, and validation bounds (`min`, `max`).
- Supported operational status states: `'idle' | 'loading' | 'empty' | 'error' | 'success'`.
- Integrated retry callback (`onRetry`) when in the `error` state.
- Complied with WCAG 2.1 Level AA accessibility standards:
  - `<label>` linked to custom input via `htmlFor`.
  - Quick preset buttons use `aria-pressed="true"` for active state.
  - Live status regions use `role="status"` and `aria-live="polite"`.
  - Errors use `role="alert"` and wire `aria-invalid="true"` / `aria-describedby`.

### 2. Reference Documentation ([docs/slippage.md](file:///home/semicolon/Pictures/Stableroute-frontend/docs/slippage.md))

- Detailed description of component purpose and operational lifecycle.
- Complete Props table (`value`, `onChange`, `options`, `status`, `message`, `onRetry`, `min`, `max`, `disabled`, `className`).
- Section explaining input validation rules (`min`, `max`, invalid number detection).
- Minimal usage examples (controlled preset usage, custom presets, async error & retry handling).
- Accessibility feature breakdown.

### 3. Comprehensive Unit Tests ([src/components/__tests__/Slippage.test.tsx](file:///home/semicolon/Pictures/Stableroute-frontend/src/components/__tests__/Slippage.test.tsx))

- 15 unit tests achieving >95% code coverage for the component module.
- Verified default & custom preset rendering, active preset detection (`aria-pressed`), input parsing, minimum/maximum boundary validation, clear-on-empty behavior, all status states (`loading`, `empty`, `error`, `success`), retry button callback, disabled state, and `React.memo` prop stability.

### 4. Repository Index Link ([README.md](file:///home/semicolon/Pictures/Stableroute-frontend/README.md#L61))

- Added `Slippage` to the **Shared UI components** table in `README.md` with links to both the source code and reference documentation.

---

## Component Contract Reference

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | `undefined` | Current slippage tolerance percentage value (e.g. `0.5` for 0.5%). |
| `onChange` | `(value: number) => void` | `undefined` | Callback invoked when a preset option is selected or a valid custom percentage is entered. |
| `options` | `number[]` | `[0.1, 0.5, 1.0]` | Array of preset percentage values displayed as quick selection buttons. |
| `status` | `'idle' \| 'loading' \| 'empty' \| 'error' \| 'success'` | `'idle'` | Operational status of the component. |
| `message` | `string` | `undefined` | Text message displayed in `empty`, `error`, or `success` states. |
| `onRetry` | `() => void` | `undefined` | Callback invoked when the user clicks the "Retry" button in the `error` state. |
| `min` | `number` | `0.01` | Minimum custom slippage percentage allowed. |
| `max` | `number` | `50.0` | Maximum custom slippage percentage allowed. |
| `disabled` | `boolean` | `false` | When `true`, disables all preset buttons and the custom input field. |
| `className` | `string` | `''` | Custom CSS class names appended to the container element. |

---

## Test Execution & Verification

```text
PASS src/components/__tests__/Slippage.test.tsx
  Slippage Component
    ✓ renders default preset options and custom input (25 ms)
    ✓ marks active preset button with aria-pressed (12 ms)
    ✓ calls onChange when preset button is clicked (8 ms)
    ✓ allows entering custom valid slippage and calls onChange (14 ms)
    ✓ validates custom input invalid string and displays error (10 ms)
    ✓ validates custom input below minimum bound (9 ms)
    ✓ validates custom input above maximum bound (8 ms)
    ✓ clears error when custom input is emptied (9 ms)
    ✓ renders loading state when status="loading" (11 ms)
    ✓ renders empty state when status="empty" (7 ms)
    ✓ renders error state and handles onRetry when status="error" (12 ms)
    ✓ renders success state message when status="success" (8 ms)
    ✓ respects disabled prop (10 ms)
    ✓ renders custom preset options (8 ms)
    ✓ does not re-render when props are referentially stable (memoized) (6 ms)

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        1.24 s
Ran all test suites matching /src\/components\/__tests__\/Slippage.test.tsx/i.

----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |     100 |      100 |     100 |     100 |                   
 Slippage.tsx   |     100 |      100 |     100 |     100 |                   
----------------|---------|----------|---------|---------|-------------------
```

---

## PR Checklist

- [x] Clear summary and reviewer-focused documentation added
- [x] Reference entry created at `docs/slippage.md`
- [x] Linked from the docs index in `README.md`
- [x] Component implementation in `src/components/Slippage.tsx` accurate to the contract
- [x] >95% test coverage achieved for impacted modules
- [x] Accessibility WCAG 2.1 AA features implemented and verified

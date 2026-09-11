# Keyboard Navigation for Swap Interface List (Roving Tabindex) (#732)

This document describes the implementation of WAI-ARIA compliant roving tabindex keyboard navigation for the swap interface list/table (`QuoteHistory`).

## Problem Statement

Prior to this change, every item in the swap interface list was an independent tab stop (`tabindex={0}`), requiring repetitive `Tab` key presses to navigate through items while arrow keys did nothing. This created an inefficient and non-standard experience for power keyboard users and assistive technology users.

## Architecture & Implementation

### 1. `useRovingTabindex` Hook (`src/app/quote/useRovingTabindex.ts`)

A pure, reusable React hook managing composite widget focus:
- **Single Tab Stop**: Guarantees that exactly one item in the list has `tabIndex={0}` (the active item), while all other items receive `tabIndex={-1}`.
- **Directional Navigation**:
  - `ArrowDown`: Moves focus to the next item and sets `tabIndex={0}`.
  - `ArrowUp`: Moves focus to the previous item and sets `tabIndex={0}`.
  - `Home`: Immediately jumps focus to the first item (`index = 0`).
  - `End`: Immediately jumps focus to the last item (`index = itemCount - 1`).
- **Activation**:
  - `Enter` / `Space`: Dispatches activation callback (`onActivate(index)`), selecting the quote for the swap form.
- **Dynamic Clamping**:
  - Automatically clamps `activeIndex` within bounds when the collection size dynamically changes (e.g. pagination or filtering).
- **Focus Synchronization**:
  - Updates `activeIndex` whenever an item receives focus directly via click or programmatic focus.

### 2. `QuoteHistory` Integration (`src/app/quote/QuoteHistory.tsx`)

- Integrates `useRovingTabindex` for both the data table and the accessible companion list.
- Connects action buttons (`Use quote ...`) with `tableRoving.getItemProps(index)`:
  - Injects dynamic `tabIndex={0 | -1}`
  - Attaches `onKeyDown` and `onFocus` handlers
  - Retains high-contrast visible focus styling: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500`

---

## Edge Cases Covered

| Edge Case | Behavior | Test Verification |
|---|---|---|
| `Tab -> enters list at one item` | Only the active row has `tabIndex=0`, others `-1`. Composite has exactly one tab stop. | Verified in `roving-tabindex.integration.test.tsx` |
| `ArrowDown / ArrowUp -> moves focus` | Shifts DOM focus and active status incrementally between rows. | Verified in `roving-tabindex.integration.test.tsx` |
| `Home / End -> first / last` | Instantly moves focus to index `0` or `itemCount - 1`. | Verified in `roving-tabindex.integration.test.tsx` |
| `Enter / Space -> activates` | Triggers `onSelect(entry)` with the focused quote data. | Verified in `roving-tabindex.integration.test.tsx` |
| `Focus ring always visible` | Buttons retain `focus-visible:outline-2` high contrast outline styles. | Verified in `roving-tabindex.integration.test.tsx` |
| `Pagination sync` | Roving tabindex resets/clamps cleanly when navigating between pages. | Verified in `roving-tabindex.integration.test.tsx` |

---

## Verification Commands

```bash
npm test -- src/app/quote --watchAll=false
npm run lint
npm run build
```

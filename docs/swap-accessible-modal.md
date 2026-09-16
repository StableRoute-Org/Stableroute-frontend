# Fully Accessible Modal for Swap Interface

## Overview

The swap interface modal provides a fully accessible dialog experience for reviewing quote details, utilizing a custom focus trap hook to ensure robust focus management.

## Architecture

### 1. Focus Trap Hook (`src/lib/useFocusTrap.ts`)

- **Initial Focus Placement**: Automatically focuses the first focusable element (or a specified `initialFocusRef`) when the modal opens.
- **Return Focus Restoration**: Remembers the `document.activeElement` before the modal opened and restores focus to it upon closing.
- **Tab Key Trapping**: Intercepts `Tab` and `Shift+Tab` keystrokes to restrict navigation strictly within the modal boundaries. Wraps seamlessly from the last element to the first, and vice versa.
- **Escape Key Dismissal**: Listens for the `Escape` key to safely trigger the `onClose` callback and close the modal.
- **Dynamic Element Discovery**: Identifies focusable children using standard selectors (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`) while ignoring disabled elements. Also accommodates JSDOM test environments by conditionally skipping visibility checks.

### 2. Swap Review Modal (`src/app/quote/SwapModal.tsx`)

- **ARIA Semantics**:
  - `role="dialog"` for screen reader context.
  - `aria-modal="true"` to prevent background content interaction for screen readers.
  - `aria-labelledby` linking to the primary heading for an accessible name.
- **Overlay Dismissal**: Clicking outside the modal panel safely closes it via `onClose`.
- **Keyboard Interactions**: Utilizes `useFocusTrap` for Escape dismissal and Tab trapping.

### 3. Integrated Client (`src/app/quote/Client.tsx`)

- **Modal Trigger**: Introduces a "Review swap" button within the quote success view, explicitly bound to the modal state.
- **Clean State Reset**: Resets modal open state upon initiating a new quote request to ensure proper workflow alignment.

## Covered Edge Cases

1. **Open Focus**: When the modal opens, the focus automatically lands on the first available focusable element (e.g. the "Cancel" button).
2. **Tab Wrapping**: Pressing `Tab` continuously cycles focus through the modal's internal interactive elements, never escaping into the inert background.
3. **Escape Closing**: Pressing the `Escape` key immediately triggers the close handler, dismissing the modal securely.
4. **Overlay Closing**: Clicking the backdrop overlay outside the main modal panel safely dismisses the modal without affecting the underlying application.
5. **Accessible Name**: The modal possesses a robust accessible name (`aria-labelledby`) pointing to its visible header, providing a distinct identity to screen reader users.

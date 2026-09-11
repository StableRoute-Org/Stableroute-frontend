# Schema-Validated Swap Interface Form with Inline Errors and Live Regions (#727)

## Overview

The swap interface form previously validated inputs loosely and silently in the event handler, without structured schema validation, accessible per-field associations, or screen-reader summary announcements. This implementation introduces:

1. **Declarative Schema Validation (`quoteSchema.ts`)**: Structured, typed validation with stable error codes (`INVALID_ASSET_CODE`, `ASSETS_MUST_DIFFER`, `INVALID_AMOUNT`) and zero risk of internal or sensitive data leakage.
2. **Accessible Live Region (`QuoteFormLiveRegion.tsx`)**: Politeness-controlled ARIA live region announcing error summaries (`assertive` on failed submit attempts; `polite` on real-time field fixes).
3. **Focus Management & Progressive Error Clearing (`useQuoteForm.ts`)**: Automatically moves focus to the first invalid field on failed submissions and clears errors as the user resolves each field.
4. **Accessible Inputs (`TextField.tsx`)**: Upgraded to forward refs to the underlying input elements, correctly associating inline error messages via `aria-describedby`, `aria-invalid="true"`, and `role="alert"`.

---

## Architectural Components

### 1. Declarative Schema & Types (`src/app/quote/quoteSchema.ts`)

- **`QuoteFormField`**: Union of `'source' | 'dest' | 'amount'`.
- **`QuoteFieldError`**: Strongly-typed error object containing `{ field, code, message }`.
- **`validateQuoteForm(values)`**: Validates all fields against `QUOTE_FORM_SCHEMA`, returning `isValid`, structured errors list, field map, and `firstInvalidField`.
- **`validateQuoteField(field, values)`**: Enables isolated single-field revalidation as user types.
- **`formatValidationSummaryAnnouncement(errors)`**: Generates concise summary announcements formatted for assistive tech (e.g., `"3 errors found: Source asset, Destination asset, Amount."`).

### 2. Live Region Component (`src/app/quote/QuoteFormLiveRegion.tsx`)

- Renders an accessible live region for screen reader users.
- Uses `aria-live="assertive"` on submit attempts to immediately alert users of blocked actions.
- Uses `aria-live="polite"` during field editing so screen reader speech queues are not interrupted unnecessarily.
- Returns `null` when `errors.length === 0` to maintain a clean accessibility tree and avoid duplicate status role conflicts.

### 3. State & Validation Hook (`src/app/quote/useQuoteForm.ts`)

- Encapsulates form values, validation status, submit attempts, and input refs (`sourceRef`, `destRef`, `amountRef`).
- Automatically focuses the first invalid element upon failed submission (`focusField`).
- Progressively clears field errors when valid input is entered (`setFieldValue`).
- Handles cross-field dependency: if `dest` failed due to matching `source` (`ASSETS_MUST_DIFFER`), updating `source` to a distinct asset immediately revalidates and clears the `dest` error.
- Cleans up state when assets are swapped (`swapAssets`) or when quotes are applied from history (`applyValues`).

### 4. Input Ref Forwarding (`src/components/TextField.tsx`)

- Wrapped with `React.forwardRef` to forward the ref directly to the native `<input>` element.
- Retains existing wiring: `aria-describedby` links to both description and error spans (`${id}-err`), and `aria-invalid="true"` when an error is present.

---

## Non-Obvious Decisions & Edge Cases

1. **Polite vs. Assertive Announcements**:
   - Technical guidance requires announcing politely unless on submit. When a user explicitly attempts to submit an invalid form, `isSubmitAttempted` triggers `aria-live="assertive"` so screen reader users are immediately aware that submission was blocked. Subsequent fixes switch back to `aria-live="polite"`.
2. **Preserving Page-Level Status Queries**:
   - The quote page contract includes test assertions verifying specific status roles and polite atomic regions (e.g., `document.querySelectorAll('[aria-live="polite"][aria-atomic="true"]')`). `QuoteFormLiveRegion` relies directly on `aria-live` without adding `aria-atomic="true"` or `role="status"` when empty, ensuring full backwards compatibility with existing test suites.
3. **Cross-Field Validation Resolution**:
   - In swap forms, `dest` asset validity depends on `source` (they must differ). `useQuoteForm` watches for edits to `source` and revalidates `dest` if it had an `ASSETS_MUST_DIFFER` error, preventing stale error states.
4. **Stable Error Codes & Safe Messaging**:
   - All errors use predefined enumeration constants (`INVALID_ASSET_CODE`, `ASSETS_MUST_DIFFER`, `INVALID_AMOUNT`) and sanitized user messages matching the established UI conventions.

---

## Verification & Test Coverage

All requirements and edge cases are validated by automated tests:

- **`quoteSchema.test.ts`**: 14 unit tests verifying asset code normalization, amount parsing, schema validation, field isolation, and announcement formatting.
- **`QuoteFormLiveRegion.test.tsx`**: 3 unit tests verifying polite/assertive live region rendering and null state.
- **`useQuoteForm.test.ts`**: 7 unit tests verifying submission blocking, focus management, progressive error clearing, cross-field clearing, and history application.
- **`schema-form-integration.test.tsx`**: 9 integration tests explicitly covering all 5 edge cases on the integrated page:
  1. _invalid field -> inline message + described-by wired_
  2. _submit with errors -> focus first invalid, summary announced_
  3. _fix a field -> its error clears_
  4. _all valid -> submits_
  5. _messages are specific per field_
- **`page.test.tsx`**: All 28 pre-existing tests pass with zero regressions.

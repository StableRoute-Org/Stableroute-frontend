# Webhooks

`WebhooksClient` (`src/app/webhooks/Client.tsx`) is the client-side view for
managing webhook subscriptions. It loads the registered webhook list, lets users
register new endpoints with selected event types, and supports removing existing
webhooks with a confirmation dialog.

## Props

`WebhooksClient` takes no props. It is the default export of `Client.tsx` and
is rendered by the RSC wrapper `src/app/webhooks/page.tsx`.

## States

The list panel is controlled by a `useList` hook and transitions through four
states:

| State       | Description                                                                      |
|-------------|----------------------------------------------------------------------------------|
| **Loading** | "Loading…" text inside the `aria-live="polite"` region; `aria-busy="true"`.     |
| **Error**   | A styled alert card with the error message and a keyboard-accessible **Retry** button. |
| **Empty**   | `<EmptyState title="No webhooks registered" …>` prompts the user to use the registration form. |
| **Success** | A `<ResourceList>` table of registered webhooks with URL, event badges, registration time, and a remove icon button. |

States are mutually exclusive and rendered inside a single `aria-live="polite" aria-atomic="true"` region.

## Registration form

The form is always visible above the list. Fields:

| Field | Type | Notes |
|-------|------|-------|
| **URL** | `<TextField type="url">` | Must use `https:` — validated client-side before the confirmation dialog. |
| **Events** | Checkbox group | At least one event must be selected. Defaults to `pair.registered`. |

Form submission opens a `<ConfirmDialog>`. Clicking **Confirm** calls
`apiPost('/api/v1/webhooks', { url, events })` and, on success, clears the URL
field and reloads the list.

Available events are sourced from `WEBHOOK_EVENT_OPTIONS` in
`src/lib/webhookEvents.ts`.

### Validation

Client-side validation runs in `registerWebhook()` before the POST:

1. `isHttpsUrl(url)` — rejects non-HTTPS URLs.
2. `selectedEvents.length > 0` — rejects empty event selection.

Validation errors are shown via `role="alert"` beneath the submit button.

## Remove flow

Each webhook row has a **Remove** `<IconButton>` (rendered by `<ResourceList>`).
Clicking it opens a confirmation dialog; confirming calls
`apiDelete('/api/v1/webhooks/:id')` and reloads the list.

## Accessibility

- List loading / empty / error states live inside a single `aria-live="polite" aria-atomic="true"` `<div>`.
- The error card uses `role="alert"` and contains a **Retry** button reachable by keyboard.
- The **Register** button has `aria-busy` set while submitting.
- Event checkboxes are wrapped in a `<fieldset>` / `<legend>` group.
- The webhook table has a `caption` and explicit `scope` attributes on column headers (see `<ResourceList>`).

## Local error state

`localError` accumulates validation and server errors from the registration
flow. It is distinct from the list-load error surfaced by `useList`. Both use
`role="alert"`, but `localError` is scoped to the form.

## Usage example

```tsx
// src/app/webhooks/page.tsx (RSC wrapper)
import WebhooksClient from './Client';
export default function WebhooksPage() {
  return <WebhooksClient />;
}
```

## Related files

| File | Role |
|------|------|
| `src/lib/useList.ts` | `useList` hook — loads the webhook list |
| `src/lib/webhookEvents.ts` | `WEBHOOK_EVENT_OPTIONS` constant |
| `src/lib/apiClient.ts` | `apiGet`, `apiPost`, `apiDelete` |
| `src/components/ResourceList.tsx` | Responsive list/table with built-in remove dialog |
| `src/lib/validate.ts` | `isWebhookListResponse` — runtime validator |

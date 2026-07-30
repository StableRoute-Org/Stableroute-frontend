# Settings

`SettingsClient` (`src/app/settings/Client.tsx`) is the client-side view for
user-facing configuration options. It groups three functional areas: theme
selection, a live preview of the resolved appearance, and the router status card
(which shows whether the API router is running or paused and lets the user
refresh it).

## Props

`SettingsClient` takes no props. It is the default export of `Client.tsx` and
is rendered by the RSC wrapper `src/app/settings/page.tsx`.

## Sub-components

### `RouterStatusRow`

Fetches `GET /api/v1/admin/status` via `useApi` and displays the router state.

| API status | Rendered content |
|------------|------------------|
| `loading`  | "Loading…" text |
| `error`    | Error message with `role="alert"` |
| `success`  | "Router is **Live**" or "Router is **Paused**" |

A **Refresh** button always renders alongside the status text; it calls
`refetch` from `useApi`.

### `AppearancePreview`

Renders a small styled panel that reflects the currently-resolved theme
(`'light'` or `'dark'`). It reads the theme from `localStorage` via
`readTheme()` and converts it to the resolved value via `effectiveTheme()`,
which calls `window.matchMedia` for the `'system'` setting.

The component listens to the `storage` window event so it updates automatically
when another tab — or `<ThemeToggle>` in the same page — writes a new theme
value. The resolved theme is exposed via `data-resolved-theme` on the preview
`<div>` for testing.

### `ApiBaseRow`

Displays the configured API base URL (from `getApiBase()` in
`src/lib/config.ts`) in a monospaced paragraph with `data-testid="api-base-value"`.
The value is read from `NEXT_PUBLIC_STABLEROUTE_API_BASE`, falling back to the
compiled-in `DEFAULT_API_BASE`. Trailing slashes are stripped.

## Theme selection

`<ThemeToggle>` renders three segmented buttons: **Light**, **Dark**, and
**System**. Clicking a button:

1. Writes the value (`'light'`, `'dark'`, or `'system'`) to `localStorage` under
   the key `'stableroute.theme'`.
2. Sets `aria-pressed="true"` on the active button and `false` on the others.

The storage key is documented in `docs/theme-storage.md`.

## Accessibility

- The Appearance section wraps `<ThemeToggle>` in a `<section>` element; `ThemeToggle` itself uses `role="group" aria-label="Theme"` to group the three segmented buttons.
- Router status errors use `role="alert"`.
- The **Refresh** button has a visible focus ring via
  `focus-visible:outline-blue-500`.
- `AppearancePreview` updates reactively, so the `data-resolved-theme`
  attribute always matches the visually rendered colours.

## Usage example

```tsx
// src/app/settings/page.tsx (RSC wrapper)
import SettingsClient from './Client';
export default function SettingsPage() {
  return <SettingsClient />;
}
```

## Related files

| File | Role |
|------|------|
| `src/lib/theme.ts` | `readTheme`, `effectiveTheme`, `Theme` type |
| `src/lib/config.ts` | `getApiBase`, `DEFAULT_API_BASE` |
| `src/lib/useApi.ts` | `useApi` hook used in `RouterStatusRow` |
| `src/lib/validate.ts` | `isRouterStatus` — runtime validator |
| `src/components/ThemeToggle.tsx` | Segmented theme selector |
| `src/components/Card.tsx` | Card wrapper used by all three sub-components |
| `docs/theme-storage.md` | `localStorage` key and theme-resolution rules |

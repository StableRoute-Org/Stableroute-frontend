# StableRoute Frontend Architecture

This app is a Next.js App Router dashboard for the StableRoute backend. Pages
live under `src/app`, shared UI primitives live under `src/components`, and
backend access is centralized in `src/lib` helpers.

## Directory Responsibilities

| Path | Responsibility |
|---|---|
| `src/app` | Route segments, page metadata, route-local client components, global layout, loading, error, and not-found boundaries. |
| `src/components` | Shared UI primitives such as `Header`, `Footer`, `Button`, `Card`, `Badge`, `StatTile`, `ToastProvider`, `ConfirmDialog`, and `ThemeToggle`. |
| `src/lib` | API helpers, polling/data hooks, formatting helpers, quote validation, event response parsing, and theme persistence. |
| `src/__tests__`, `src/components/__tests__`, `src/lib/__tests__` | App, component, and helper regression tests. |
| `docs` | Focused contributor notes for validation, accessibility, and persistence behavior. |

## Route Map

| Route | Entry file | Main client/data path | Backend/API dependency |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Static landing links and calls to action. | None. |
| `/about` | `src/app/about/page.tsx` | Static protocol overview. | None. |
| `/docs` | `src/app/docs/page.tsx` | Static endpoint reference page. | Links to backend `GET /api/v1/openapi.json`. |
| `/pairs` | `src/app/pairs/page.tsx`, `src/app/pairs/Client.tsx` | Fetches registered pairs with `apiGet`. | `GET /api/v1/pairs`. |
| `/pairs/new` | `src/app/pairs/new/page.tsx` | Normalizes and submits Stellar asset codes with `apiPost`. | `POST /api/v1/pairs`. |
| `/quote` | `src/app/quote/page.tsx`, `src/app/quote/Client.tsx` | Validates form state and performs a direct `fetch` to the quote endpoint. | `GET /api/v1/quote`. |
| `/stats` | `src/app/stats/page.tsx`, `src/app/stats/Client.tsx` | Polls every 5 seconds and renders `StatTile` values. | `GET /api/v1/stats`. |
| `/admin` | `src/app/admin/page.tsx`, `src/app/admin/Client.tsx` | Loads status and posts pause/unpause actions. | `GET /api/v1/admin/status`, `POST /api/v1/admin/pause`, `POST /api/v1/admin/unpause`. |
| `/api-keys` | `src/app/api-keys/page.tsx`, `src/app/api-keys/Client.tsx` | Creates, lists, and revokes API keys. | `GET/POST /api/v1/api-keys`, `DELETE /api/v1/api-keys/:prefix`. |
| `/events` | `src/app/events/page.tsx`, `src/app/events/Client.tsx` | Fetches audit events and validates them through `parseEventsResponse`. | `GET /api/v1/events?limit=100`. |
| `/webhooks` | `src/app/webhooks/page.tsx`, `src/app/webhooks/Client.tsx` | Creates, lists, and removes webhook subscribers. | `GET/POST /api/v1/webhooks`, `DELETE /api/v1/webhooks/:id`. |
| `/settings` | `src/app/settings/page.tsx`, `src/app/settings/Client.tsx` | Shows API base and theme controls. | Reads `NEXT_PUBLIC_STABLEROUTE_API_BASE`; uses local theme storage. |

## Application Shell

`src/app/layout.tsx` owns the global shell:

1. Imports `src/app/globals.css`.
2. Defines default metadata and social metadata.
3. Renders the skip link for `#main-content`.
4. Wraps the app in `ToastProvider`.
5. Registers `ApiAuthGuard`, then renders `Header`, route content, and `Footer`.

Every page-level `<main>` should keep `id="main-content"` and `tabIndex={-1}`
so the skip link works consistently.

## Data Flow

The standard backend flow is:

```text
page/client component -> src/lib/useApi or src/lib/apiClient -> fetch(
  NEXT_PUBLIC_STABLEROUTE_API_BASE + path
) -> StableRoute backend JSON -> local render state
```

`src/lib/apiClient.ts` reads `NEXT_PUBLIC_STABLEROUTE_API_BASE` and falls back to
`http://localhost:3001`. It exports:

- `apiFetch<T>(path, init)` for typed fetches and shared error handling.
- `apiGet`, `apiPost`, `apiPatch`, and `apiDelete` convenience wrappers.
- `registerAuthErrorHandler`, used by `ApiAuthGuard` to surface `401` and `403`
  responses through the toast system.

`src/lib/useApi.ts` is a small client-side hook for simple `GET` requests. It
exposes a discriminated state union: `loading`, `error`, or `ok`. Several pages
still use route-local `useEffect` state because they need polling, mutation
reloads, or custom request construction.

`src/app/quote/Client.tsx` is the main direct-fetch exception. It builds a query
URL from validated form values because the endpoint is a `GET` with query
parameters and needs access to the structured `requestId` on errors.

## UI Primitives

Shared components are intentionally small and route-agnostic:

- `Header` and `Footer` provide persistent navigation and footer links.
- `Button`, `Card`, `Badge`, `TextField`, `PageHeading`, `EmptyState`,
  `Spinner`, `StatTile`, and `TimeAgo` cover reusable display/control surfaces.
- `ToastProvider` exposes `useToast().push(message, level)` and renders timed
  toasts in a polite live region. Error toasts use `role="alert"`; info toasts
  use `role="status"`.
- `ApiAuthGuard` registers an auth-error handler inside `ToastProvider` so
  backend `401`/`403` responses can notify the user globally.
- `ConfirmDialog` is the shared modal confirmation primitive for destructive
  flows.
- `ThemeToggle` uses `src/lib/theme.ts` to read, write, and resolve the current
  appearance setting.

## Theme and Storage

The only persistent browser storage key in the current tree is:

| Key | Owner | Values | Behavior |
|---|---|---|---|
| `stableroute.theme` | `src/lib/theme.ts` and `ThemeToggle` | `light`, `dark`, `system` | Invalid or unavailable storage falls back to `system`; writes are best-effort. |

`effectiveTheme("system")` checks `window.matchMedia("(prefers-color-scheme:
dark)")`. `ThemeToggle` applies the resolved mode by toggling the `dark` class
on `document.documentElement`.

## Error and Accessibility Patterns

- Request failures should render `role="alert"` near the relevant control or
  data region.
- Dynamic loading/empty/loaded list regions should use a single polite live
  region. See `docs/loading-regions.md`.
- Route content should remain keyboard reachable through the global skip link.
- Backend response bodies should be treated as untrusted at UI boundaries where
  shapes are loose. The event log uses `src/lib/events.ts` for this pattern.

## Contributor Checklist

When adding a route or backend integration:

1. Put the route under `src/app/<route>`.
2. Keep reusable UI in `src/components`, not route-local copies.
3. Prefer `apiClient` or `useApi` for backend calls unless the request needs a
   custom URL or polling/mutation behavior.
4. Add route or helper tests near the changed surface.
5. Update this guide and README if the route map, environment variables, or
   storage keys change.

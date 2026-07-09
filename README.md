# stableroute-frontend

Next.js frontend application for [StableRoute](https://github.com/StableRoute-Org/Stableroute) — the Stellar liquidity routing protocol. It provides user interfaces for obtaining path routing quotes, managing liquidity pairs, viewing stats, configuring API keys and webhooks, browsing audit logs, adjusting developer settings, and reading endpoint documentation.

## What this repo contains

- **Next.js 15** (App Router) with **React 19**
- **TailwindCSS** for styling
- A comprehensive set of routing, management, and audit log pages integrated with the StableRoute backend.

## Routes

Each route is defined under `src/app` and connects to its respective UI page:

- **`/`** ([page.tsx](src/app/page.tsx)): Home landing page with navigation links and quick CTAs.
- **`/pairs`** ([pairs/page.tsx](src/app/pairs/page.tsx)): Lists registered currency pairs on the router.
- **`/pairs/new`** ([pairs/new/page.tsx](src/app/pairs/new/page.tsx)): Form interface to register a new currency pair.
- **`/quote`** ([quote/page.tsx](src/app/quote/page.tsx)): Form interface to request currency routing path quotes.
- **`/stats`** ([stats/page.tsx](src/app/stats/page.tsx)): Status dashboard showing system metrics and polling the backend.
- **`/admin`** ([admin/page.tsx](src/app/admin/page.tsx)): Control center to pause or unpause router activity.
- **`/api-keys`** ([api-keys/page.tsx](src/app/api-keys/page.tsx)): Dashboard to create, list, and revoke API keys.
- **`/events`** ([events/page.tsx](src/app/events/page.tsx)): Audit log page rendering the system event log history.
- **`/webhooks`** ([webhooks/page.tsx](src/app/webhooks/page.tsx)): Webhook manager for listing and adding event subscribers.
- **`/settings`** ([settings/page.tsx](src/app/settings/page.tsx)): User settings interface hosting the light/dark appearance toggle.
- **`/docs`** ([docs/page.tsx](src/app/docs/page.tsx)): Documentation page describing the API endpoints and usage.
- **`/about`** ([about/page.tsx](src/app/about/page.tsx)): Static about page describing the protocol.

## Footer Navigation

The shared footer keeps the StableRoute tagline visible on every page, renders the current copyright year dynamically, and links to `/docs`, `/about`, and the StableRoute Discord community.

## Configuration & API Integration

The frontend communicates with the StableRoute API backend.

### Environment Variables

- **`NEXT_PUBLIC_STABLEROUTE_API_BASE`**: Specifies the base URL of the StableRoute API backend (defaults to `http://localhost:3001` if unset).

### API Endpoints Consumed

- **`/api/v1/pairs`**: Lists registered pairs (`GET`) and registers new pairs (`POST`).
- **`/api/v1/quote`**: Requests path routing quotes for (source, destination, amount) triples (`GET`).
- **`/api/v1/stats`**: Retrieves system performance and routing metrics (`GET`).
- **`/api/v1/admin/status`**: Retrieves router paused status (`GET`).
- **`/api/v1/admin/pause` / `/api/v1/admin/unpause`**: Pauses and unpauses routing activity (`POST`).
- **`/api/v1/api-keys`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/api-keys/:prefix`) API keys.
- **`/api/v1/events`**: Retrieves system event audit logs (`GET`).
- **`/api/v1/webhooks`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/webhooks/:id`) webhook subscriptions.

### Asset Codes

Stellar asset codes entered through the new-pair form are trimmed, validated as
1-12 ASCII letters or numbers, uppercased before submission, and compared after
normalization so duplicate pairs such as `usdc` and `USDC` cannot be registered.

## Prerequisites

- Node.js 18+
- npm

## Setup (contributors)

1. Clone the repo and enter the directory:
   ```bash
   git clone <repo-url> && cd stableroute-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build and test:
   ```bash
   npm run build
   npm test
   ```
4. Run locally:
   ```bash
   npm run dev
   ```
   App: `http://localhost:3000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run Jest tests |
| `npm run lint` | Next.js ESLint |

## Accessibility

### ARIA Live Regions

Dynamic list updates (loading → loaded / loading → empty) on the pairs, events, api-keys, and webhooks pages are wrapped in `aria-live="polite"` regions so screen-reader users are notified when content arrives. Error messages continue to use `role="alert"` for assertive announcements. A single polite region per page prevents double announcements.

For pending/success form submissions, follow the same pattern: a
`<p role="status" aria-live="polite" className="sr-only">` node that is
always rendered in the DOM and updated via component state. The error
path stays on `role="alert"` (assertive); the polite status is cleared
on error so the two announcements do not collide. See
[`src/app/pairs/new/page.tsx`](src/app/pairs/new/page.tsx) for the
reference implementation.

## API client

The app talks to the StableRoute backend through a thin wrapper in
[`src/lib/apiClient.ts`](src/lib/apiClient.ts). The wrapper:

- Exposes four typed helpers — `apiGet`, `apiPost`, `apiPatch`, `apiDelete`
  — built on top of a shared `apiFetch` that always sends
  `Content-Type: application/json`.
- Returns `undefined` for `204 No Content` and empty-bodied 2xx responses
  so callers do not need a null check.
- Throws a normal `Error` on any non-2xx response. The thrown error
  carries a `.status` property and any fields from the backend's
  `ApiError` envelope (`error`, `message`, optional `requestId`).
- Invokes the registered auth-error handler on 401/403 before throwing
  (see below), so unauthenticated responses can surface a toast without
  each call site re-implementing the check.

### Error envelope

```ts
type ApiError = {
  error: string;       // short machine-readable code
  message: string;     // human-readable message
  requestId?: string;  // backend correlation id, if available
};
```

Any of these fields may be missing if the backend did not return a
structured body; the wrapper synthesises a sensible `Error` from whatever
is available (e.g. `new Error("HTTP 500")` when the body is empty).

### Auth-error handler

The module owns a **single-slot** auth-error handler. Register one with
`registerAuthErrorHandler` and call the returned function to unregister:

```ts
const unregister = registerAuthErrorHandler((status) => {
  // 401 → "Your session has expired."
  // 403 → "You don't have permission to perform that action."
});
// later, on unmount:
unregister();
```

`<ApiAuthGuard>` ([`src/components/ApiAuthGuard.tsx`](src/components/ApiAuthGuard.tsx))
is the only place in the app that registers a handler — it wires the
callback to the toast provider, so 401/403 responses surface a toast
without each call site re-implementing the check. Because the slot is
single, only the most recent registration is active; always store and
call the unregister function from the most recent call.

## Data pages

Data-fetching pages (e.g. `/pairs`, `/events`, `/api-keys`, `/webhooks`,
`/stats`) standardize on the [`src/lib/useApi.ts`](src/lib/useApi.ts)
hook. The hook returns a discriminated `state` (`loading | error | ok`)
and provides built-in cancellation on unmount; do **not** hand-roll a
`useEffect` + `useState` fetch pair inside a page or component — it
duplicates the loading/error/empty machinery and skips the cancellation
behaviour the hook provides.

The pairs list page is the reference implementation: see
[`src/app/pairs/Client.tsx`](src/app/pairs/Client.tsx).

## StatTile

[`src/components/StatTile.tsx`](src/components/StatTile.tsx) renders a
`<dt>/<dd>` tile and accepts an optional trend affordance:

```tsx
<StatTile
  label="Conversion"
  value="3.2%"
  delta={1.5}
  deltaUnit="%"
/>
```

The optional props are:

- `delta?: number` — numeric change since the previous measurement.
  Direction (`up`/`down`/`flat`) is derived from the sign; the visible
  text is the formatted absolute value with a leading `+` or `-`.
- `trend?: "up" | "down" | "flat"` — pre-computed direction. Use this
  when the change is categorical rather than numeric. Mutually
  exclusive with `delta`.
- `deltaUnit?: string` — suffix appended to the visible text (e.g. `"%"`).
- `formatDelta?: (value: number) => string` — custom formatter. Defaults
  to one decimal place, no sign.

Colour is never the only signal: every indicator carries a full
`aria-label` (e.g. `"Conversion increased by 1.5%"`) so screen readers
and users with colour-vision differences get the same information.
The arrow glyph is `aria-hidden="true"`; the visible numeric text is
outside the aria-hidden subtree and is announced.

The props are all optional, so existing call sites compile unchanged.

## UI styleguide

The shared visual language (Badge variants, Button variants, focus-ring
convention, light/dark palette pairing) is documented in
[`docs/STYLEGUIDE.md`](docs/STYLEGUIDE.md). New components should copy
patterns from there rather than introducing ad-hoc Tailwind class strings.
A sync test in `src/components/__tests__/Styleguide.test.tsx` fails the
build if the guide falls out of sync with `Badge.tsx` or `Button.tsx`.

## CI/CD

On every push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

Ensure these pass locally before pushing.

## Contributing

1. Fork the repo and create a branch from `main`.
2. Add tests for new UI/behavior; keep `npm run build` and `npm test` passing.
3. Open a PR; CI must be green.

## License

MIT

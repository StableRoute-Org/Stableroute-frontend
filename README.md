# stableroute-frontend

Next.js frontend application for [StableRoute](https://github.com/StableRoute-Org/Stableroute) - the Stellar liquidity routing protocol. It provides user interfaces for obtaining path routing quotes, managing liquidity pairs, viewing stats, configuring API keys and webhooks, browsing audit logs, adjusting developer settings, and reading endpoint documentation.

## What this repo contains

- **Next.js 15** (App Router) with **React 19**
- **TailwindCSS** for styling
- A comprehensive set of routing, management, and audit log pages integrated with the StableRoute backend.

## UI Styleguide

Contributor-facing Badge variants, Button variants, focus-ring conventions, and
light/dark color pairs are documented in
[`docs/STYLEGUIDE.md`](docs/STYLEGUIDE.md).

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

## Keyboard Shortcuts

Press `?` from any route to open the keyboard-shortcuts help overlay. The overlay is mounted from the shared layout, ignores shortcut activation while focus is in editable fields, and closes with Escape, the close button, or a backdrop click.

## Configuration & API Integration

The frontend communicates with the StableRoute API backend.

### Data-fetching convention

Data-backed pages should use the shared `useApi` hook from `src/lib/useApi.ts`
for `loading` / `ok` / `error` state handling and unmount cancellation instead
of hand-rolled `useEffect` fetch logic. This keeps live regions, error states,
and cleanup behavior consistent across pages.

### Environment Variables

- **`NEXT_PUBLIC_STABLEROUTE_API_BASE`**: Specifies the base URL of the StableRoute API backend (defaults to `http://localhost:3001` if unset).

The API base must be an absolute `http` or `https` URL. Shared API helpers also
require request paths to start with `/`, which keeps frontend requests on the
configured StableRoute API origin and avoids leaking requests to arbitrary
hosts through misconfiguration or absolute-path call sites.

### API Endpoints Consumed

- **`/api/v1/pairs`**: Lists registered pairs (`GET`) and registers new pairs (`POST`).
- **`/api/v1/quote`**: Requests path routing quotes for (source, destination, amount) triples (`GET`).
- **`/api/v1/stats`**: Retrieves system performance and routing metrics (`GET`).
- **`/api/v1/admin/status`**: Retrieves router paused status (`GET`).
- **`/api/v1/admin/pause` / `/api/v1/admin/unpause`**: Pauses and unpauses routing activity (`POST`).
- **`/api/v1/api-keys`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/api-keys/:prefix`) API keys.
- **`/api/v1/events`**: Retrieves system event audit logs (`GET`).
- **`/api/v1/webhooks`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/webhooks/:id`) webhook subscriptions.

### Security Headers

`next.config.ts` applies baseline hardening headers to every route:

- `X-Content-Type-Options: nosniff` prevents MIME sniffing from treating a
  response as executable content.
- `Referrer-Policy: strict-origin-when-cross-origin` limits cross-origin
  referrers to the origin instead of full dashboard URLs.
- `X-Frame-Options: DENY` prevents the operator console from being framed.
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` disables
  browser capabilities that this dashboard does not use.

### Asset Codes

Stellar asset codes entered through the new-pair form are trimmed, validated as
1-12 ASCII letters or numbers, uppercased before submission, and compared after
normalization so duplicate pairs such as `usdc` and `USDC` cannot be registered.

## Getting started

### Prerequisites

- Node.js 18.18.0 or newer.
- npm, which is bundled with supported Node.js releases.
- A StableRoute backend reachable at `NEXT_PUBLIC_STABLEROUTE_API_BASE`; when
  the variable is unset, the frontend uses `http://localhost:3001`.

1. Clone the repo and enter the directory:
   ```bash
   git clone <repo-url> && cd stableroute-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` with the backend URL you want Next.js to use. For the
   default local backend:
   ```bash
   echo "NEXT_PUBLIC_STABLEROUTE_API_BASE=http://localhost:3001" > .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
   App: `http://localhost:3000`.
5. Verify the app before opening a PR:
   ```bash
   npm run lint
   npm run build
   npm test
   ```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js development server on `http://localhost:3000`. |
| `npm run build` | Create a production Next.js build. |
| `npm run start` | Serve the production build locally; run `npm run build` first. |
| `npm run lint` | Run the Next.js ESLint checks. |
| `npm test` | Run the Jest test suite once. |
| `npm run test:watch` | Run Jest in watch mode while developing tests. |

## Testing

- Use `npm test` for the full Jest suite.
- Use `npm run test:watch` while editing tests or UI behavior.
- Use `npm test -- --coverage` to run the same Jest suite with coverage
  reporting. The repository does not define a separate coverage script.

The new-pair form has focused Jest coverage for asset normalization, same-asset
rejection, backend error alerts, redirect-on-success, and the in-flight saving
state.

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

## Accessibility

### UI styleguide

The shared visual language (Badge variants, Button variants, focus-ring
convention, light/dark palette pairing) is documented in
[`docs/STYLEGUIDE.md`](docs/STYLEGUIDE.md). New components should copy
patterns from there rather than introducing ad-hoc Tailwind class strings.
A sync test in `src/components/__tests__/Styleguide.test.tsx` fails the
build if the guide falls out of sync with `Badge.tsx` or `Button.tsx`.

### ARIA Live Regions

Dynamic list updates (loading -> loaded / loading -> empty) on the pairs, events, api-keys, and webhooks pages are wrapped in `aria-live="polite"` regions so screen-reader users are notified when content arrives. Error messages continue to use `role="alert"` for assertive announcements. A single polite region per page prevents double announcements.

The API keys create form uses a labelled group and a persistent associated field
label so the purpose of the create controls remains available after focus.

For pending/success form submissions, follow the same pattern: a
`<p role="status" aria-live="polite" className="sr-only">` node that is
always rendered in the DOM and updated via component state. The error
path stays on `role="alert"` (assertive); the polite status is cleared
on error so the two announcements do not collide. See
[`src/app/pairs/new/page.tsx`](src/app/pairs/new/page.tsx) for the
reference implementation.

## CI/CD

On every push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

Ensure these pass locally before pushing.

## Contributing

1. Fork the repo and create a branch from `main`.
2. Use the `type/area-slug` branch naming convention when possible, such as `docs/github-templates` or `fix/quote-validation`.
3. Use the issue templates in `.github/ISSUE_TEMPLATE/` for bug reports and feature requests so reproduction steps, affected routes/components, environment details, and accessibility notes are captured consistently.
4. Add tests for new UI/behavior; keep `npm run build` and `npm test` passing.
5. Before opening a PR, review `.github/PULL_REQUEST_TEMPLATE.md` and include the commands you ran, docs changes, and accessibility checks.
6. Open a PR; CI must be green. For questions or review coordination, join the StableRoute Discord: https://discord.gg/37aCpusvx

## License

MIT

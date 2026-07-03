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

### API Client Contract

`src/lib/apiClient.ts` centralizes frontend calls to the backend through
`apiGet`, `apiPost`, `apiPatch`, and `apiDelete`, all layered on `apiFetch`.
Paths are resolved relative to `NEXT_PUBLIC_STABLEROUTE_API_BASE`; requests send
`Content-Type: application/json` by default, and JSON request bodies are
serialized by the method helpers.

The backend error envelope is represented by `ApiError`:

```ts
type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};
```

Failed responses reject with an `Error` whose message prefers
`ApiError.message`, whose `status` property carries the HTTP status, and whose
parsed error fields are copied onto the thrown object. `204 No Content`
resolves to `undefined`; non-empty successful responses must parse as JSON.

`registerAuthErrorHandler` stores one global auth callback for `401` and `403`
responses. Registering a new callback replaces the previous one, and the
returned unregister function removes it only if it is still active.
`ApiAuthGuard` mounts this handler inside `ToastProvider` so auth failures show
toasts while the original API call still rejects normally.

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

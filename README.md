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
- **`/quote`** ([quote/page.tsx](src/app/quote/page.tsx)): Form interface to request currency routing path quotes. Inputs use the shared [`TextField`](src/components/TextField.tsx) component for accessible labels, `aria-describedby`, and per-field validation errors.
- **`/stats`** ([stats/page.tsx](src/app/stats/page.tsx)): Status dashboard showing system metrics and polling the backend.
- **`/admin`** ([admin/page.tsx](src/app/admin/page.tsx)): Control center to pause or unpause router activity.
- **`/api-keys`** ([api-keys/page.tsx](src/app/api-keys/page.tsx)): Dashboard to create, list, and revoke API keys. Newly created keys are marked with a "New" badge and their creation time is displayed via relative timestamps (`TimeAgo`).
- **`/events`** ([events/page.tsx](src/app/events/page.tsx)): Audit log page rendering the system event log history.
- **`/webhooks`** ([webhooks/page.tsx](src/app/webhooks/page.tsx)): Webhook manager for listing and adding event subscribers.
- **`/settings`** ([settings/page.tsx](src/app/settings/page.tsx)): User settings interface hosting the light/dark appearance toggle.
- **`/docs`** ([docs/page.tsx](src/app/docs/page.tsx)): Documentation page describing the API endpoints and usage.
- **`/about`** ([about/page.tsx](src/app/about/page.tsx)): Static about page describing the protocol.

## Shared UI components

Reusable building blocks live under `src/components` and are imported by route pages:

| Component | Purpose |
|-----------|---------|
| [`TextField`](src/components/TextField.tsx) | Accessible labeled inputs with `aria-describedby` error wiring |
| [`Button`](src/components/Button.tsx) | Primary actions; supports `asChild` for link-style buttons |
| [`IconButton`](src/components/IconButton.tsx) | Icon-only controls with required `aria-label` |
| [`PageHeading`](src/components/PageHeading.tsx) | Consistent page title + optional description |
| [`ConfirmDialog`](src/components/ConfirmDialog.tsx) | Modal confirmation with focus trap and Escape to dismiss |
| [`EmptyState`](src/components/EmptyState.tsx) | Placeholder when a list has no rows |
| [`StatTile`](src/components/StatTile.tsx) | Metric card used on `/stats` |
| [`TimeAgo`](src/components/TimeAgo.tsx) | Relative timestamps with `aria-label` |
| [`Badge`](src/components/Badge.tsx) | Status badge with configurable variants (neutral, ok, warning, danger) |
| [`ThemeToggle`](src/components/ThemeToggle.tsx) | Light/dark appearance switch persisted in `localStorage` |
| [`ToastProvider`](src/components/ToastProvider.tsx) | App-wide toast notifications |
| [`KeyboardShortcutsHelp`](src/components/KeyboardShortcutsHelp.tsx) | `?` overlay listing keyboard shortcuts |
| [`CommandPalette`](src/components/CommandPalette.tsx) | `Cmd/Ctrl+K` route jump palette |

Data fetching helpers (`apiClient`, `useApi`, `useList`) live in `src/lib`.

## Footer Navigation

The shared footer keeps the StableRoute tagline visible on every page, renders the current copyright year dynamically, and links to `/docs`, `/about`, and the StableRoute Discord community.

## Configuration & API Integration

The frontend communicates with the StableRoute API backend.

### API Client Error Contract

The shared API client (`src/lib/apiClient.ts`) exposes `apiFetch`, `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`. All calls return a promise that resolves to the parsed JSON body (or `undefined` on `204`) and rejects with an `Error` on failure.

Rejected errors are guaranteed to carry a `status` property (`number`) and, when the server returns a parseable JSON error body matching the `ApiError` shape, the `error` and `requestId` properties from the response. When the response is non-OK and the body is empty or not valid JSON, the client synthesises an `ApiError`-shaped error:

| Property | Value |
|----------|-------|
| `message` | `"Request failed (<status>)"` |
| `error` | `"http_<status>"` |
| `status` | `<status>` (the HTTP status code) |

This ensures that callers never receive a raw `SyntaxError` from a gateway HTML page, an empty `502` body, or any other non-JSON response. A `200` with a non-JSON body throws `"Invalid JSON response"`.


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

### Pointing at a backend

By default the dashboard calls `http://localhost:3001`. To target another StableRoute API instance:

```bash
# Unix/macOS
export NEXT_PUBLIC_STABLEROUTE_API_BASE=https://staging-api.example.com

# Windows PowerShell
$env:NEXT_PUBLIC_STABLEROUTE_API_BASE="https://staging-api.example.com"

npm run dev
```

The client reads this value in [`src/lib/apiClient.ts`](src/lib/apiClient.ts). Restart the dev server after changing env vars.

## Local development & testing workflow

1. **Install & typecheck**
   ```bash
   npm install
   npm run build
   ```
2. **Run the full Jest suite**
   ```bash
   npm test
   ```
3. **Watch mode while editing tests**
   ```bash
   npm run test:watch
   ```
4. **Run a single test file**
   ```bash
   npx jest src/app/quote/page.test.tsx --runInBand
   ```
5. **Lint**
   ```bash
   npm run lint
   ```

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| API calls fail with `ECONNREFUSED` | Start the StableRoute backend or set `NEXT_PUBLIC_STABLEROUTE_API_BASE` |
| Jest OOM on Windows | Run with `NODE_OPTIONS=--max-old-space-size=4096 npx jest …` |
| Fork PR CI shows **action required** | A maintainer must approve GitHub Actions for fork PRs |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run Jest in watch mode |
| `npm run lint` | Next.js ESLint |

## Accessibility

### ARIA Live Regions

Dynamic list updates (loading → loaded / loading → empty) on the pairs, events, api-keys, and webhooks pages are wrapped in `aria-live="polite"` regions so screen-reader users are notified when content arrives. Error messages continue to use `role="alert"` for assertive announcements. A single polite region per page prevents double announcements.

The events log also gives each row a `Copy JSON` button and an expand/collapse toggle. Large payloads start collapsed so verbose entries stay scannable, and the payload region is linked to the toggle with `aria-controls` and `aria-expanded` for assistive technology.

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

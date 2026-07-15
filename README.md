# stableroute-frontend

Next.js frontend application for [StableRoute](https://github.com/StableRoute-Org/Stableroute) — the Stellar liquidity routing protocol. It provides user interfaces for obtaining path routing quotes, managing liquidity pairs, viewing stats, configuring API keys and webhooks, browsing audit logs, adjusting developer settings, and reading endpoint documentation.

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

`src/lib/apiClient.ts` reads this value once at module load and appends each
`/api/v1/...` path to it. The pairs, stats, admin, API keys, events, webhooks,
and new-pair pages use that shared client; the quote page also targets the same
base URL directly for `/api/v1/quote`. Run the backend at
`http://localhost:3001` for the default local setup, or set the environment
variable before starting Next.js.

### API Endpoints Consumed

- **`/api/v1/pairs`**: Lists registered pairs (`GET`) and registers new pairs (`POST`).
- **`/api/v1/quote`**: Requests path routing quotes for (source, destination, amount) triples (`GET`).
- **`/api/v1/stats`**: Retrieves system performance and routing metrics (`GET`).
- **`/api/v1/admin/status`**: Retrieves router paused status (`GET`).
- **`/api/v1/admin/pause` / `/api/v1/admin/unpause`**: Pauses and unpauses routing activity (`POST`).
- **`/api/v1/api-keys`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/api-keys/:prefix`) API keys.
- **`/api/v1/events`**: Retrieves system event audit logs (`GET`).
- **`/api/v1/webhooks`**: Creates (`POST`), lists (`GET`), and revokes (`DELETE` at `/api/v1/webhooks/:id`) webhook subscriptions.

### Quote Amount Display

The quote API accepts and returns amounts in base units. The `/quote` page keeps
the raw API values intact for requests and operator inspection, while rendering
safe integer quote amounts through the shared `formatStroops` helper and numeric
rates through `formatNumber`. If a backend value cannot be parsed safely, the UI
falls back to the raw string instead of rounding or coercing it.

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

## Accessibility

### Toast queue behavior

The shared `ToastProvider` caps visible notifications at three toasts. Repeated
messages with the same severity collapse into one toast with a count badge and
refresh the auto-dismiss timer, while timers for dropped toasts are cleared.
Info toasts keep `role="status"`, error toasts keep `role="alert"`, and the
stack remains inside a polite live region.

### ARIA Live Regions

Dynamic list updates (loading → loaded / loading → empty) on the pairs, events, api-keys, and webhooks pages are wrapped in `aria-live="polite"` regions so screen-reader users are notified when content arrives. Error messages continue to use `role="alert"` for assertive announcements. A single polite region per page prevents double announcements.

The API keys create form uses a labelled group and a persistent associated field
label so the purpose of the create controls remains available after focus.

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

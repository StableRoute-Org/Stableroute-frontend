# stableroute-frontend

Next.js frontend application for [StableRoute](https://github.com/StableRoute-Org/Stableroute) — the Stellar liquidity routing protocol. It provides user interfaces for obtaining path routing quotes, managing liquidity pairs, viewing stats, configuring API keys and webhooks, browsing audit logs, adjusting developer settings, and reading endpoint documentation.

## What this repo contains

- **Next.js 15** (App Router) with **React 19**
- **TailwindCSS** for styling
- A comprehensive set of routing, management, and audit log pages integrated with the StableRoute backend.
- **Per-page metadata** for SEO and accessibility, with unique titles and descriptions for each route.

The `<html>` element in `src/app/layout.tsx` includes `lang="en" dir="ltr"` for accessibility and to make the document direction explicit. While the app is currently only available in English, right-to-left (RTL) language support could be added by dynamically setting `dir="rtl"` on the `<html>` tag based on the user's locale or language preference.

## Route metadata

Each route exports a `metadata` object from `src/app/<route>/page.tsx`. This keeps the default title template in `src/app/layout.tsx` intact while supplying unique titles and descriptions for search engines and assistive technologies. Interactive pages such as `/pairs`, `/quote`, `/stats`, `/admin`, `/api-keys`, `/events`, and `/webhooks` use a small server wrapper page that exports metadata and then renders a client component.

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
- **`/docs`** ([docs/page.tsx](src/app/docs/page.tsx)): Documentation page describing the API endpoints and usage. The **OpenAPI spec link** is resolved from `NEXT_PUBLIC_STABLEROUTE_API_BASE` so it always points at the configured backend rather than the frontend origin. It opens in a new tab with `rel="noopener noreferrer"` and includes an accessible hint that it leaves the dashboard.
- **`/about`** ([about/page.tsx](src/app/about/page.tsx)): Static about page describing the protocol.

### Metadata Strategy

Each route's `page.tsx` is a Server Component that exports a `metadata` object. This allows Next.js to set a unique `<title>` and `<meta name="description">` for each page at build time or during server rendering, which is essential for both SEO and providing context to users of assistive technologies. The title is combined with the site name using the `title.template` from the root layout.

For pages with heavy client-side interactivity (e.g., `/pairs`, `/quote`), the `page.tsx` acts as a thin server wrapper. It exports the metadata and then imports and renders a corresponding `Client.tsx` component which contains the interactive logic and UI. This pattern combines the benefits of Server Components (metadata, static rendering) with Client Components (state, effects, event listeners).

## Shared UI components

Reusable building blocks live under `src/components` and are imported by route pages:

| Component                                                           | Purpose                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`TextField`](src/components/TextField.tsx)                         | Accessible labeled inputs with `aria-describedby` error wiring         |
| [`Button`](src/components/Button.tsx)                               | Primary actions; supports `asChild` for link-style buttons             |
| [`IconButton`](src/components/IconButton.tsx)                       | Icon-only controls with required `aria-label`                          |
| [`PageHeading`](src/components/PageHeading.tsx)                     | Consistent page title + optional description                           |
| [`ConfirmDialog`](src/components/ConfirmDialog.tsx)                 | Modal confirmation with focus trap and Escape to dismiss               |
| [`EmptyState`](src/components/EmptyState.tsx)                       | Placeholder when a list has no rows                                    |
| [`StatTile`](src/components/StatTile.tsx)                           | Metric card used on `/stats`                                           |
| [`TimeAgo`](src/components/TimeAgo.tsx)                             | Relative timestamps with `aria-label`                                  |
| [`Badge`](src/components/Badge.tsx)                                 | Status badge with configurable variants (neutral, ok, warning, danger) |
| [`ThemeToggle`](src/components/ThemeToggle.tsx)                     | Light/dark appearance switch persisted in `localStorage`               |
| [`ToastProvider`](src/components/ToastProvider.tsx)                 | App-wide toast notifications                                           |
| [`KeyboardShortcutsHelp`](src/components/KeyboardShortcutsHelp.tsx) | `?` overlay listing keyboard shortcuts                                 |
| [`CommandPalette`](src/components/CommandPalette.tsx)               | `Cmd/Ctrl+K` route jump palette                                        |

Data fetching helpers (`apiClient`, `useApi`, `useList`) live in `src/lib`.

## Footer Navigation

The shared footer keeps the StableRoute tagline visible on every page, renders the current copyright year dynamically, and links to `/docs`, `/about`, and the StableRoute Discord community.

## Configuration & API Integration

The frontend communicates with the StableRoute API backend.

### API Client Error Contract

The shared API client (`src/lib/apiClient.ts`) exposes `apiFetch`, `apiGet`, `apiPost`, `apiPatch`, and `apiDelete`. All calls return a promise that resolves to the parsed JSON body (or `undefined` on `204`) and rejects with an `Error` on failure.

Rejected errors are guaranteed to carry a `status` property (`number`) and, when the server returns a parseable JSON error body matching the `ApiError` shape, the `error` and `requestId` properties from the response. When the response is non-OK and the body is empty or not valid JSON, the client synthesises an `ApiError`-shaped error:

| Property  | Value                             |
| --------- | --------------------------------- |
| `message` | `"Request failed (<status>)"`     |
| `error`   | `"http_<status>"`                 |
| `status`  | `<status>` (the HTTP status code) |

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

| Symptom                              | Fix                                                                     |
| ------------------------------------ | ----------------------------------------------------------------------- |
| API calls fail with `ECONNREFUSED`   | Start the StableRoute backend or set `NEXT_PUBLIC_STABLEROUTE_API_BASE` |
| Jest OOM on Windows                  | Run with `NODE_OPTIONS=--max-old-space-size=4096 npx jest …`            |
| Fork PR CI shows **action required** | A maintainer must approve GitHub Actions for fork PRs                   |

## Scripts

| Script               | Description                |
| -------------------- | -------------------------- |
| `npm run dev`        | Start dev server (Next.js) |
| `npm run build`      | Production build           |
| `npm run start`      | Run production server      |
| `npm test`           | Run Jest tests             |
| `npm run test:watch` | Run Jest in watch mode     |
| `npm run lint`       | Next.js ESLint             |

## Accessibility

StableRoute aims for **WCAG 2.1 Level AA** compliance. For full details on our target conformance level, tested assistive-technology and browser matrix, built-in accessibility features, feedback channel, and known-gaps register, see our official [Accessibility Conformance Statement](docs/ACCESSIBILITY.md).

### Reduced Motion (Issue #309)

Users who enable "Reduce Motion" in their OS or browser accessibility settings are automatically served a version of the UI with all animations and transitions collapsed to a near-zero duration. This is handled by a single `@media (prefers-reduced-motion: reduce)` rule in [`src/app/globals.css`](src/app/globals.css) that overrides every CSS animation and transition across the application.

Animations affected:

| Component                                  | Tailwind class  | Behaviour under reduced motion                                                                                           |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `<Spinner>` (`src/components/Spinner.tsx`) | `animate-spin`  | SVG stops spinning; `role="status"` and `sr-only` label are **preserved** so screen readers still announce loading state |
| Loading skeleton (`src/app/loading.tsx`)   | `animate-pulse` | Skeleton shapes remain visible as static placeholders                                                                    |
| Any future transition                      | `transition-*`  | Collapsed to `0.01 ms`                                                                                                   |

The component APIs and visual design for users without reduced-motion enabled are **unchanged**.

#### How to test

| Platform      | Steps                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------ |
| macOS         | System Settings → Accessibility → Display → enable **Reduce Motion**                                         |
| Windows       | Settings → Ease of Access → Display → turn off **Show animations**                                           |
| Linux (GNOME) | Settings → Accessibility → Seeing → enable **Reduced Animation**                                             |
| Any browser   | Open DevTools → **Rendering** panel → set **Emulate CSS media feature `prefers-reduced-motion`** to `reduce` |

### ARIA Live Regions

Dynamic list updates (loading → loaded / loading → empty) on the pairs, events, api-keys, and webhooks pages are wrapped in `aria-live="polite"` regions so screen-reader users are notified when content arrives. Error messages continue to use `role="alert"` for assertive announcements. A single polite region per page prevents double announcements.

The events log also gives each row a `Copy JSON` button and an expand/collapse toggle. Large payloads start collapsed so verbose entries stay scannable, and the payload region is linked to the toggle with `aria-controls` and `aria-expanded` for assistive technology.

### Event Payload Safety

Event payloads are safetly serialised before rendering to prevent UI lockups or unsafe content leakage:

- **Circular references** are detected via a `WeakSet` replacer and replaced with `"[Circular]"` so a self-referencing payload never throws at render time.
- **Size limit**: Serialised payloads are truncated at 4 000 characters with a `… truncated` suffix. A "Show full" button reveals the complete payload on demand, and the `Copy JSON` button always copies the full (untruncated) payload.
- **Fallback safety**: If `JSON.stringify` throws for any reason, the event is silently dropped instead of crashing the event log.

All rendering uses inert text inside `<pre>` — no `dangerouslySetInnerHTML` is employed.

## CI/CD

On every push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

Ensure these pass locally before pushing.

## Security

Please report security issues via a GitHub issue titled `SECURITY:` or by emailing `security@stableroute.org`.
For coordinated disclosure, avoid public disclosure until a fix is available and give maintainers time to investigate.

## Contributing

We welcome contributions! Here's how to get started:

1. **Choose or report an issue** — Browse [open issues](https://github.com/StableRoute-Org/Stableroute-frontend/issues) or use our templates to file a [bug report](.github/ISSUE_TEMPLATE/bug_report.md) or [feature request](.github/ISSUE_TEMPLATE/feature_request.md).
2. **Fork the repo and create a branch** — Use the `type/area-slug` convention (e.g. `feat/quote-89-swap-direction`, `fix/api-keys-validation`).
3. **Implement & test** — Add tests for new UI/behavior and verify locally:
   ```bash
   npm run lint
   npm test
   npm run build
   ```
4. **Open a PR** — Follow the [pull request template](.github/PULL_REQUEST_TEMPLATE.md) checklist. CI must be green. Reference the issue with `Closes #123`.
5. **Join the community** — Questions? Need a review? Chat with us on [Discord](https://discord.gg/37aCpusvx).

## License

MIT

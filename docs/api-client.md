# apiClient contract

The shared HTTP client lives in `src/lib/apiClient.ts`.

## Base URL

Requests are sent to `${getApiBase()}${path}` where `getApiBase()` reads
`NEXT_PUBLIC_STABLEROUTE_API_BASE` (see `src/lib/config.ts`).

## Error shape

Failed responses parse JSON bodies matching:

```ts
type ApiError = {
  error: string;
  message: string;
  requestId?: string;
};
```

Thrown errors are `Error` instances with optional `status` and `requestId`.

## Auth error handler

`registerAuthErrorHandler()` is called once from `<ApiAuthGuard>` inside
`<ToastProvider>`. When the API returns **401** or **403**, the registered
handler shows a toast and the request still rejects so callers can react.

## Helpers

| Function | Method | Notes |
|----------|--------|-------|
| `apiGet` | GET | Optional retry on 5xx |
| `apiPost` | POST | JSON body |
| `apiPatch` | PATCH | JSON body |
| `apiDelete` | DELETE | 204 → `undefined` |

## `useList` hook

The `useList` hook (`src/lib/useList.ts`) provides a reusable load/reload pattern for
dashboard CRUD pages that fetch lists of items.

```ts
function useList<T>(loader: () => Promise<T[]>): {
  items: T[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};
```

| Field     | Description                                         |
|-----------|-----------------------------------------------------|
| `items`   | The fetched list, or `null` before the first load.  |
| `error`   | Non-null when the last load failed. Cleared by `reload`. |
| `loading` | `true` during the initial load and every `reload`.  |
| `reload`  | Re-runs `loader`, clears errors, and updates state. |

State updates are suppressed after the component unmounts (via a cancellation ref).

## Timeouts

Default timeout is 15s (`timeoutMs` option). Abort errors surface as
`Request timed out`; network failures as `Network request failed`.

## Routes catalogue

`src/lib/routes.ts` exports a `ROUTES` constant that drives navigation,
the command palette, and page headings. Every entry has a unique `href`,
`title`, and `description`.

```ts
type RouteEntry = {
  href: string;        // URL path (e.g. "/pairs")
  title: string;       // Display label (e.g. "Pairs")
  description: string; // Tooltip / palette subtitle
};
```

The keys are: `home`, `pairs`, `quote`, `stats`, `admin`, `events`,
`webhooks`, `apiKeys`, `settings`, `docs`.

Tests assert uniqueness and non-emptiness of every field so that adding
a route without a description fails the test.

## Webhook events catalogue

`src/lib/webhookEvents.ts` exports the documented set of webhook event
identifiers as `WEBHOOK_EVENT_OPTIONS` and a type guard
`isWebhookEventType()`.

```ts
const WEBHOOK_EVENT_OPTIONS = [
  "pair.registered",
  "pair.deleted",
  "quote.requested",
  "router.paused",
  "router.unpaused",
] as const;

type WebhookEventType = (typeof WEBHOOK_EVENT_OPTIONS)[number];

function isWebhookEventType(value: string): value is WebhookEventType;
```

Tests assert the exact set of identifiers matches the documented
canonical list and that `isWebhookEventType` correctly discriminates
valid events from invalid ones.

# apiClient contract

The shared HTTP client lives in `src/lib/apiClient.ts`.

## Base URL

Requests are sent to `${getApiBase()}${path}` where `getApiBase()` reads
`NEXT_PUBLIC_STABLEROUTE_API_BASE` (see `src/lib/config.ts`).

## API Response Types

All API response type definitions are centralized in `src/lib/types.ts` to
maintain a single source of truth and prevent type drift between pages.

### Available Types

- **`Pair`** — Routing pair response: `{ source, destination }`
- **`Quote`** — Quote response: `{ source_asset, dest_asset, amount, estimated_rate, route[] }`
- **`AppEvent`** — Raw event from API: `{ id, ts, type, payload }`
- **`DisplayEvent`** — Rendered event with serialized payloads: `{ id, ts, type, payloadPreview, fullPayload }`
- **`ApiKey`** — API key metadata: `{ prefix, label, createdAt }`
- **`CreateApiKeyResponse`** — API key creation response: `{ key, prefix? }`
- **`Webhook`** — Webhook subscription: `{ id, url, events[], createdAt }`

### Importing Types

Types are exported directly from `src/lib/types.ts`:

```ts
import type { Quote, Pair, ApiKey } from '@/lib/types';
```

For backward compatibility, types are also re-exported from their validation/utility modules:

```ts
// Both work:
import type { Quote } from '@/lib/types';
import type { Quote } from '@/lib/quote';

// Both work:
import type { AppEvent, DisplayEvent } from '@/lib/types';
import type { AppEvent, DisplayEvent } from '@/lib/events';

// Both work:
import type { Pair } from '@/lib/types';
import { type Pair } from '@/app/pairs/pairsUtils';
```

### Validation Functions

Validation logic remains in their respective modules:

- `quote.ts` — `isValidAmount()`, `assetsDiffer()`, `normalizeAsset()`
- `events.ts` — `parseEventsResponse()`, `escapeCsvCell()`, `buildEventsCsv()`
- `webhookEvents.ts` — `isWebhookEventType()`

These validators continue to use the centralized types, ensuring all validation is type-safe and consistent.

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

## Error message sanitization

Before any error message is placed on a thrown `Error` (and therefore before it
can reach a toast or inline error element), it is passed through
`sanitizeErrorMessage()`. This function removes two classes of sensitive data:

### 1. Query strings

Any `?key=value` or `&key=value` segment is stripped. This prevents asset
codes, amounts, and other request inputs from appearing in UI copy.

```
Input:  "Bad request: ?source_asset=USDC&dest_asset=EURC&amount=1000000"
Output: "Bad request:"
```

### 2. Key-like tokens

Contiguous runs of 20 or more characters that match the hex (`0-9a-fA-F`) or
Base58 (`1-9A-HJ-NP-Za-km-z`) alphabets are replaced with `[redacted]`. This
covers API keys, Stellar wallet addresses, and other long opaque secrets.

Prefixed key formats — two underscore-separated label segments followed by 16 or
more alphanumeric characters (e.g. `sk_live_…`, `pk_test_…`, `api_key_…`) — are
also redacted regardless of the character set used in the suffix.

```
Input:  "Invalid API key: deadbeefcafebabedeadbeef"
Output: "Invalid API key: [redacted]"

Input:  "Unknown destination: GBVHELLD2JE235Y2NGTDT3MWI3T65ON6SY4N6FBHYVDAQ5FZC2CP5QXH"
Output: "Unknown destination: [redacted]"

Input:  "Unauthorized: sk_live_abcdef1234567890abcdef"
Output: "Unauthorized: [redacted]"
```

### requestId is preserved

The `requestId` field from the API response body is attached directly to the
thrown `Error` **object** — not embedded in the message string — so support
teams can still correlate failures without the message leaking sensitive data.

```ts
// Accessing requestId in a catch block:
const err = await apiFetch('/api/v1/quote?...').catch((e) => e);
console.log(err.message); // sanitized, safe to show in a toast
console.log(err.requestId); // original, safe for support correlation
```

## Auth error handler

`registerAuthErrorHandler()` is called once from `<ApiAuthGuard>` inside
`<ToastProvider>`. When the API returns **401** or **403**, the registered
handler shows a toast and the request still rejects so callers can react.

## Helpers

| Function    | Method | Notes                 |
| ----------- | ------ | --------------------- |
| `apiGet`    | GET    | Optional retry on 5xx |
| `apiPost`   | POST   | JSON body             |
| `apiPatch`  | PATCH  | JSON body             |
| `apiDelete` | DELETE | 204 → `undefined`     |

## Timeouts

Default timeout is 15s (`timeoutMs` option). Abort errors surface as
`Request timed out`; network failures as `Network request failed`.

## Runtime Validation

`apiClient.ts` casts parsed JSON directly to the caller's generic type. To
catch malformed or hostile responses **before** they reach React, pass a
`validate` option — a runtime type guard — on any fetch call.

### How it works

```ts
import { apiGet } from '@/lib/apiClient';
import { isWebhookListResponse } from '@/lib/validate';

const body = await apiGet<{ items: Webhook[] }>('/api/v1/webhooks', {
  validate: isWebhookListResponse,
});
// body is guaranteed to match the Webhook[] shape at runtime.
```

If validation fails, a `ValidationError` is thrown (see below) and the
response never reaches the caller.

### With `useApi`

```ts
import { useApi } from '@/lib/useApi';
import { isStats } from '@/lib/validate';

const result = useApi<Stats>('/api/v1/stats', isStats);
// result.data is validated before state is set.
```

### With `apiPost` / `apiPatch`

```ts
import { apiPost } from '@/lib/apiClient';
import { isCreateApiKeyResponse } from '@/lib/validate';

const created = await apiPost<CreateApiKeyResponse>(
  '/api/v1/api-keys',
  { label: 'Prod' },
  { validate: isCreateApiKeyResponse }
);
```

### Available validators

All validators live in `src/lib/validate.ts`. Each is a pure function with
no external dependencies.

| Guard | Validates |
|---|---|
| `isPair` | `{ source: string; destination: string }` |
| `isQuote` | `{ source_asset, dest_asset, amount, estimated_rate, route[] }` |
| `isApiKey` | `{ prefix: string; label: string; createdAt: number }` |
| `isCreateApiKeyResponse` | `{ key: string; prefix?: string }` |
| `isWebhook` | `{ id, url, events (valid event types), createdAt }` |
| `isRouterStatus` | `{ paused: boolean }` |
| `isStats` | `{ totalPairs: number; paused: boolean }` |
| `isPairsResponse` | `{ pairs: Pair[] }` |
| `isApiKeyListResponse` | `{ items: ApiKey[] }` |
| `isWebhookListResponse` | `{ items: Webhook[] }` |

Each guard also has a `parse*` counterpart that throws `ValidationError`
with structural metadata (field path, expected type, received type) rather
than the raw value — preventing sensitive data from leaking into logs.

### ValidationError

```ts
class ValidationError extends Error {
  code: 'VALIDATION_ERROR';
  field: string;     // e.g. "root", "events[2].type", "key"
  expected: string;  // e.g. "string", "boolean", "webhook_event_type"
  received: string;  // type description only — never the raw value
}
```

`ValidationError` carries only structural metadata. Sensitive fields (e.g.
API key secrets) are never attached to the error object, regardless of which
field failed validation. The `received` field is produced by an internal
`describeType()` helper that returns type names (`"string"`, `"object"`,
`"array"`, etc.), never stringified values.

### Opt-in design

Validation is **opt-in**. Resources not yet wired to a validator (e.g. the
health probe on the status page) continue to work unchanged. Add `validate`
incrementally to the endpoints that benefit most from it first.

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

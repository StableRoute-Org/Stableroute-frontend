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

## Timeouts

Default timeout is 15s (`timeoutMs` option). Abort errors surface as
`Request timed out`; network failures as `Network request failed`.

## API Key Security

By default, API key identifiers are partially masked in the UI (e.g. `sk_live_1••••••••`) to prevent accidental leaks in screenshots or screen shares. A toggle allows the user to explicitly reveal the full identifier. The revealed value is strictly maintained in local component state and is never persisted to storage or logs.

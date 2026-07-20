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

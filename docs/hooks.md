# Hook Contracts

This document defines the contracts for the custom React hooks used for data fetching in the Stableroute frontend.

## `useApi<T>(path: string | null)`

Standard hook for fetching a single resource or data object from the API.

### Return Shape

Both data hooks use the exported `FetchState<T>` discriminated union. `refetch`
is available in every state, while `data` and `error` only exist in the states
where they are valid:

```typescript
type FetchState<T, TRefetch = () => void> =
  | { status: 'idle'; refetch: TRefetch }
  | { status: 'loading'; refetch: TRefetch }
  | { status: 'success'; data: T; refetch: TRefetch }
  | { status: 'error'; error: string; refetch: TRefetch };
```

### Loading Semantics

- Initially `status` is `"loading"`.
- When `path` changes, `status` reverts to `"loading"`.
- Errors during fetching update `status` to `"error"` and set the `error` message.

### Null-Path Behaviour

- If `path` is `null`, the hook returns `status: "idle"` and no API request is fired. This is useful for conditional data fetching.

### Example Usage

```tsx
const result = useApi<MyResource>('/api/resource/123');

if (result.status === 'idle' || result.status === 'loading') return <Spinner />;
if (result.status === 'error') return <div>Error: {result.error}</div>;

return <div>Data: {result.data.name}</div>;
```

---

## `useList<T>(loader: () => Promise<T[]>)`

Standard hook for fetching a list of resources.

### Return Shape

The hook returns an object of type `UseListResult<T>`:

```typescript
type UseListResult<T> = FetchState<T[], () => Promise<void>>;
```

### Loading Semantics

- Initially `status` is `"loading"`.
- On successful load, `status` is `"success"` and `data` is the loaded array.
- On error, `status` is `"error"` and `error` contains the failure message.
- Calling `refetch` returns a promise and transitions back through `"loading"`.

### Example Usage

```tsx
const loader = useCallback(() => apiGet<MyItem[]>('/api/items'), []);
const result = useList(loader);

if (result.status === 'idle' || result.status === 'loading') return <Spinner />;
if (result.status === 'error') return <div>Error: {result.error}</div>;

return (
  <ul>
    {result.data.map((item) => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);
```

---

## When to use `apiFetch` directly

Use `apiFetch` (or `apiGet`, `apiPost`, etc.) directly when:

1. The data fetching is not tied to the component lifecycle (e.g., triggered by an event handler).
2. You need complex control over caching, suspense, or parallel fetching not supported by these hooks.
3. You are fetching data inside `getServerSideProps` or other server-side contexts.

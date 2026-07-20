# Hook Contracts

This document defines the contracts for the custom React hooks used for data fetching in the Stableroute frontend.

## `useApi<T>(path: string | null)`

Standard hook for fetching a single resource or data object from the API.

### Return Shape
The hook returns an object of type `UseApiResult<T>`:

```typescript
type UseApiResult<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T }
  | { refetch: () => void }; // Combined with status properties
```

### Loading Semantics
- Initially `status` is `"loading"`.
- When `path` changes, `status` reverts to `"loading"`.
- Errors during fetching update `status` to `"error"` and set the `error` message.

### Null-Path Behaviour
- If `path` is `null`, the hook remains in `"loading"` state indefinitely and no API request is fired. This is useful for conditional data fetching.

### Example Usage
```tsx
const { status, data, refetch } = useApi<MyResource>("/api/resource/123");

if (status === "loading") return <Spinner />;
if (status === "error") return <div>Error: {error}</div>;

return <div>Data: {data.name}</div>;
```

---

## `useList<T>(loader: () => Promise<T[]>)`

Standard hook for fetching a list of resources.

### Return Shape
The hook returns an object of type `UseListResult<T>`:

```typescript
type UseListResult<T> = {
  items: T[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};
```

### Loading Semantics
- Initially `loading` is `true`, `items` is `null`.
- On successful load, `items` is set, `error` is `null`, `loading` is `false`.
- On error, `items` remains `null` (or previous value), `error` is set, `loading` is `false`.

### Example Usage
```tsx
const loader = useCallback(() => apiGet<MyItem[]>("/api/items"), []);
const { items, loading, error, reload } = useList(loader);

if (loading) return <Spinner />;
if (error) return <div>Error: {error}</div>;

return <ul>{items?.map(item => <li key={item.id}>{item.name}</li>)}</ul>;
```

---

## When to use `apiFetch` directly

Use `apiFetch` (or `apiGet`, `apiPost`, etc.) directly when:
1. The data fetching is not tied to the component lifecycle (e.g., triggered by an event handler).
2. You need complex control over caching, suspense, or parallel fetching not supported by these hooks.
3. You are fetching data inside `getServerSideProps` or other server-side contexts.

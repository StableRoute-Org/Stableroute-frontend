# Theme Storage

StableRoute stores the appearance preference in `localStorage` under
`stableroute.theme`. The only accepted values are `light`, `dark`, and
`system`.

If storage is unavailable, throws, or contains an unknown value, `readTheme`
falls back to `system`. `writeTheme` is best-effort and silently skips the write
when storage rejects access, so theme persistence cannot crash hydration or
rendering.

The value is stored as a **plain string** (`dark`, not `"dark"`) rather than
JSON, because [`public/theme-init.js`](../public/theme-init.js) — a
pre-hydration script that can't import application code — reads the same key
with a raw `localStorage.getItem()` string comparison to avoid a flash of the
wrong theme before React mounts. Keep the two in sync if this ever changes.

## `useLocalStorage`

`readTheme`/`writeTheme` (in [`src/lib/theme.ts`](../src/lib/theme.ts)) and
[`ThemeToggle`](../src/components/ThemeToggle.tsx)'s own state are both built
on the shared [`useLocalStorage`](../src/lib/useLocalStorage.ts) hook, which
also backs the quote page's saved-inputs prefill
([`src/app/quote/Client.tsx`](../src/app/quote/Client.tsx)). It centralizes
the guarded localStorage access that used to be duplicated in each call site:

- **SSR-safe** — returns the default value on the server and on first client
  render (avoiding a hydration mismatch), then syncs from storage in an
  effect once mounted.
- **Parse-failure-safe** — malformed JSON, or a value that fails an optional
  `validate` predicate, falls back to the default instead of throwing.
- **Write-failure-safe** — a quota-exceeded or disabled-storage error on
  write is swallowed; the in-memory state still updates so the UI keeps
  working even though the value won't persist across a reload.
- **Serialization is pluggable** — defaults to JSON (`readLocalStorageValue`/
  `writeLocalStorageValue`), but accepts a `rawStringSerializer` for values
  (like the theme) that must round-trip as a plain string rather than
  JSON-quoted, to stay compatible with a non-JSON reader or with values
  persisted before the hook existed.

```tsx
const [theme, setTheme] = useLocalStorage<Theme>(
  THEME_KEY,
  "system",
  isTheme,
  rawStringSerializer,
);
```

See [`src/lib/__tests__/useLocalStorage.test.ts`](../src/lib/__tests__/useLocalStorage.test.ts)
for the full behavior contract, including SSR, malformed JSON, validation
rejection, and quota-exceeded write failures.

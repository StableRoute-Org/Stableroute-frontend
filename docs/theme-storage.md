# Theme Storage

StableRoute stores the appearance preference in `localStorage` under
`stableroute.theme`. The only accepted values are `light`, `dark`, and
`system`.

If storage is unavailable, throws, or contains an unknown value, `readTheme`
falls back to `system`. `writeTheme` is best-effort and silently skips the write
when storage rejects access, so theme persistence cannot crash hydration or
rendering.

## Storage key

| Key | Values | Default |
|-----|--------|---------|
| `stableroute.theme` | `"light"` \| `"dark"` \| `"system"` | `"system"` |

## How theme resolution works

```
stored value        effectiveTheme() result
───────────────     ───────────────────────────────
"light"         →   "light"
"dark"          →   "dark"
"system"        →   "light" or "dark" (matchMedia query)
absent/unknown  →   readTheme() returns "system" → matchMedia
```

`effectiveTheme` reads `window.matchMedia("(prefers-color-scheme: dark)")` to
resolve `"system"` at render time. In server-side rendering (no `window`), it
falls back to `"light"`.

## AppearancePreview

`AppearancePreview` in `src/app/settings/Client.tsx` listens for
`window` `storage` events so the preview region updates automatically when the
theme is changed from another browser tab without requiring a page reload.

It also exposes a `data-resolved-theme` attribute on its root element
(`data-testid="appearance-preview"`) so tests can assert the resolved value
directly without relying on CSS class names.

## API base display

The resolved API base URL is read from `getApiBase()` in `src/lib/config.ts`
and displayed inside an element with `data-testid="api-base-value"`. The value
comes from the `NEXT_PUBLIC_STABLEROUTE_API_BASE` environment variable, falling
back to `http://localhost:3001` when the variable is unset. Trailing slashes are
stripped before display.

## Testing the settings page

The test suite at `src/app/settings/page.test.tsx` covers:

- Theme button clicks write the correct value under `stableroute.theme`
- Only `stableroute.theme` is written (no key pollution)
- `aria-pressed` reflects the active selection
- API base shows the default or the env-override URL
- Trailing slashes are stripped from the displayed URL
- `AppearancePreview` resolves to `"light"` or `"dark"` based on the selection
- `AppearancePreview` resolves `"system"` via `matchMedia`
- `AppearancePreview` reacts to cross-tab `storage` events
- Unknown/corrupt localStorage values fall back gracefully to `"system"`
- The page renders without crashing when localStorage is unavailable

Run the settings tests in isolation:

```bash
npx jest src/app/settings/page.test.tsx --verbose
```
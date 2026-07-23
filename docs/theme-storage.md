# Theme Storage

StableRoute stores the appearance preference in `localStorage` under
`stableroute.theme`. The only accepted values are `light`, `dark`, and
`system`.

If storage is unavailable, throws, or contains an unknown value, `readTheme`
falls back to `system`. `writeTheme` is best-effort and silently skips the write
when storage rejects access, so theme persistence cannot crash hydration or
rendering.

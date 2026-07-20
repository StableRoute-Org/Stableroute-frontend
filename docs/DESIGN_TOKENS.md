# UI design tokens

StableRoute frontend uses Tailwind with CSS variables defined in `src/app/globals.css`.

## Color variables

| Token | Light | Dark (`.dark`) |
|-------|-------|----------------|
| `--foreground` | `#0a0a0a` | `#f5f5f5` |
| `--background` | `#fafafa` | `#0a0a0a` |
| `--muted` | `#525252` | `#a3a3a3` |
| `--border` | `#e5e5e5` | `#262626` |
| `--card` | `#ffffff` | `#171717` |

## Badge variants

| Variant | Usage |
|---------|--------|
| `neutral` | Default tags |
| `ok` | Success / live status |
| `warning` | Paused / caution |
| `danger` | Destructive actions |

See `src/components/Badge.tsx` for class mappings.

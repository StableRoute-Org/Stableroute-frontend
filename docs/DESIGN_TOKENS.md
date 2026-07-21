# UI design tokens

StableRoute frontend uses Tailwind with CSS variables defined in `src/app/globals.css`.

## Color variables

| Token                 | Light                | Dark (`.dark`)       |
| --------------------- | -------------------- | -------------------- |
| `--foreground`        | `#0a0a0a`            | `#f5f5f5`            |
| `--background`        | `#fafafa`            | `#0a0a0a`            |
| `--muted`             | `#525252`            | `#a3a3a3`            |
| `--border`            | `#e5e5e5`            | `#262626`            |
| `--card`              | `#ffffff`            | `#171717`            |
| `--focus-ring-color`  | `#2563eb` (blue-600) | `#60a5fa` (blue-400) |
| `--focus-ring-offset` | `2px`                | `2px`                |

`--focus-ring-color` switches shade between themes because a single blue
holds acceptable contrast against only one of the two `--background` values:
blue-600 measures ~5.2:1 on the light background/card but drops to ~2.1:1 on
the dark ones, so the dark theme swaps to the lighter blue-400 (~7.8:1
against dark `--background`) to stay above the WCAG 2.1 non-text contrast
minimum of 3:1. `--focus-ring-offset` is shared across themes since offset
doesn't affect contrast.

Applied via Tailwind arbitrary values on every interactive element that
previously hardcoded `focus-visible:outline-blue-500` — `Button`,
`IconButton`, `TextField`, `ThemeToggle`, the `Header` nav/skip links, and
several one-off buttons/links across `Footer`, `ShortcutsHelp`,
`ToastProvider`, and the app-level pages (`layout`, `error`, `not-found`,
`page`, `pairs/new`, `settings`):

```tsx
focus-visible:outline focus-visible:outline-2
focus-visible:outline-offset-[var(--focus-ring-offset)]
focus-visible:outline-[color:var(--focus-ring-color)]
```

"System" theme resolves to either `:root` or `.dark` at runtime (see
[`docs/theme-storage.md`](./theme-storage.md)), so it always gets one of the
two token values above — there is no separate "system" CSS state to handle.

## Badge variants

| Variant   | Usage                 |
| --------- | --------------------- |
| `neutral` | Default tags          |
| `ok`      | Success / live status |
| `warning` | Paused / caution      |
| `danger`  | Destructive actions   |

See `src/components/Badge.tsx` for class mappings.

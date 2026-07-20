# UI Styleguide

This document is the source of truth for the StableRoute frontend's visual
language. When you add a new component, copy patterns from here rather than
inventing ad-hoc Tailwind class strings — that's how the design drifts.

The conventions below are pulled directly from the source in
[`src/components/Badge.tsx`](../src/components/Badge.tsx),
[`src/components/Button.tsx`](../src/components/Button.tsx),
[`tailwind.config.ts`](../tailwind.config.ts), and
[`src/app/globals.css`](../src/app/globals.css). If you change a token in
those files, update this guide in the same PR.

## Color tokens

The app is built on Tailwind's default palette with no custom theme extends.
The two global CSS variables in `src/app/globals.css` set the body
foreground/background and are the only custom colors:

```css
:root {
  --foreground: #0a0a0a;
  --background: #fafafa;
}
```

Light/dark mode pairs are written as `bg-{color}-100 text-{color}-800` for
light surfaces and `dark:bg-{color}-950 dark:text-{color}-300` for dark. Always
include both halves of the pair — picking just one will leave the badge
unreadable in the other mode.

## Focus rings

All interactive elements must be reachable by keyboard with a visible focus
indicator. The convention is a 2-pixel outline whose color and offset come
from the `--focus-ring-color` / `--focus-ring-offset` tokens in
[`src/app/globals.css`](../src/app/globals.css) (see
[`docs/DESIGN_TOKENS.md`](./DESIGN_TOKENS.md)), applied via the shared `ring`
constant in [`src/components/Button.tsx`](../src/components/Button.tsx):

```tsx
const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[var(--focus-ring-offset)] focus-visible:outline-[color:var(--focus-ring-color)]";
```

Use this exact class string on every `<button>`, `<a>`, and form control —
`TextField`, `ThemeToggle`, `Header`, `Footer`, `ShortcutsHelp`,
`ToastProvider`, and the app-level pages all apply it. Never replace it with
a Tailwind `ring-*` utility — the explicit outline is visible against the
dark-mode background where the default ring is not. Never hardcode a
Tailwind color utility (e.g. `outline-blue-500`) here either — the token
swaps shade between themes to stay above the 3:1 WCAG contrast minimum,
which a single static color can't do.

## `Button` variants

`Button` (`src/components/Button.tsx`) ships with three variants. Pick the one
that matches the action's intent; do not override the colors with extra
classes.

| Variant | When to use | Visual |
|---|---|---|
| `primary` (default) | The page's main action (Submit, Save, Connect). One per page. | Solid black in light mode, solid white in dark mode. |
| `secondary` | A supporting action next to a primary one (Cancel, Reset). | Outlined, neutral border that darkens on hover. |
| `danger` | A destructive or irreversible action (Revoke key, Delete webhook). | Solid rose-600 / rose-700 hover. Confirm with a dialog before using. |

All buttons share `rounded-full px-5 py-2 text-sm font-medium`, are
disabled-friendly via `disabled:opacity-50 disabled:cursor-not-allowed`, and
inherit the focus ring from above.

## `Badge` variants

`Badge` (`src/components/Badge.tsx`) is the inline status pill used on lists,
table rows, and detail headers. Variants map to semantic state, not raw
color:

| Variant | When to use | Pair (light) | Pair (dark) |
|---|---|---|---|
| `neutral` (default) | Static metadata, version strings, non-actionable labels. | `bg-neutral-100 text-neutral-700` | `dark:bg-neutral-800 dark:text-neutral-300` |
| `ok` | Success states — `active`, `connected`, `healthy`. | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-950 dark:text-emerald-300` |
| `warning` | Degraded or attention-needed states — `paused`, `pending`, `retrying`. | `bg-amber-100 text-amber-800` | `dark:bg-amber-950 dark:text-amber-300` |
| `danger` | Failure or destructive states — `revoked`, `error`, `expired`. | `bg-rose-100 text-rose-800` | `dark:bg-rose-950 dark:text-rose-300` |

The base shape is `inline-flex items-center rounded-full px-2 py-0.5 text-xs
font-medium` and is applied automatically. Do not wrap a `Badge` inside a
`Button` — they are semantically distinct.

## Reduced motion

`src/app/globals.css` honours `prefers-reduced-motion` by collapsing
animation and transition durations to ~0ms across the whole app. When you add
a new transition, prefer a short Tailwind `transition-*` utility so this
global override takes effect automatically. Do not use raw CSS
`@keyframes` or set `transition-duration` inline.

## When to add a new token

If you find yourself reaching for a class like `bg-teal-500` or
`text-slate-600`, stop. Either:

1. Use the closest existing palette (neutral, emerald, amber, rose) with the
   `100` / `800` (light) and `950` / `300` (dark) pairing from the `Badge`
   table, or
2. Open an issue proposing a new semantic token (e.g. `info` for the blue
   family) and discuss it with a maintainer before adding it.

Adding a new color in isolation is the most common source of design drift and
will be requested for revision in review.

## Related

- [`README.md`](../README.md) — overview, routes, scripts.
- [`docs/theme-storage.md`](./theme-storage.md) — light/dark toggle and the
  `localStorage` contract that backs it.

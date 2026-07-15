# UI Styleguide

This guide documents the shared UI tokens that contributors should reuse when
adding StableRoute surfaces. The current implementation keeps design tokens
close to the components with Tailwind utility classes, so prefer the existing
components before adding new variants.

## Badge Variants

Use `src/components/Badge.tsx` for short statuses, labels, and compact metadata.
Badges are rendered as rounded pills with `inline-flex items-center rounded-full
px-2 py-0.5 text-xs font-medium`.

| Variant | Use for | Light mode | Dark mode |
|---------|---------|------------|-----------|
| `neutral` | Default metadata, inactive states, informational labels | `bg-neutral-100 text-neutral-700` | `dark:bg-neutral-800 dark:text-neutral-300` |
| `ok` | Healthy, connected, successful, or enabled states | `bg-emerald-100 text-emerald-800` | `dark:bg-emerald-950 dark:text-emerald-300` |
| `warning` | Pending, degraded, or attention-needed states | `bg-amber-100 text-amber-800` | `dark:bg-amber-950 dark:text-amber-300` |
| `danger` | Failed, destructive, revoked, or blocked states | `bg-rose-100 text-rose-800` | `dark:bg-rose-950 dark:text-rose-300` |

Examples:

```tsx
<Badge>Draft</Badge>
<Badge variant="ok">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Revoked</Badge>
```

## Button Variants

Use `src/components/Button.tsx` for native button actions. The base shape is a
rounded pill with `rounded-full px-5 py-2 text-sm font-medium`; disabled buttons
use `disabled:opacity-50 disabled:cursor-not-allowed`.

| Variant | Use for | Classes |
|---------|---------|---------|
| `primary` | Main page action or form submission | `bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200` |
| `secondary` | Lower-emphasis actions, filters, and navigation-style controls | `border border-neutral-300 hover:border-neutral-500 dark:border-neutral-700 dark:hover:border-neutral-500` |
| `danger` | Destructive or irreversible actions | `bg-rose-600 text-white hover:bg-rose-700` |

Examples:

```tsx
<Button>Save route</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Revoke key</Button>
```

## Focus Rings

Interactive controls should keep the focus-visible convention from
`src/components/Button.tsx`:

```tsx
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
```

Use this pattern on new custom controls so keyboard focus is visible without
adding a permanent outline for pointer users.

## Theme Colors

Global foreground and background colors live in `src/app/globals.css`:

```css
:root {
  --foreground: #0a0a0a;
  --background: #fafafa;
}
```

The `body` reads those variables, while component-level light and dark pairs are
expressed with Tailwind classes such as `bg-neutral-100` with
`dark:bg-neutral-800`. Keep new component colors paired for both light and dark
mode when the component is visible in both themes.

## Tailwind Scope

`tailwind.config.ts` scans `src/pages`, `src/components`, and `src/app` for
`js`, `ts`, `jsx`, `tsx`, and `mdx` files. The repo does not currently extend
Tailwind theme tokens, so new reusable visual decisions should either reuse the
classes above or be documented when a shared component introduces them.

## Motion

`src/app/globals.css` also honors `prefers-reduced-motion: reduce` by minimizing
animation and transition duration. Do not rely on animation as the only way to
communicate state changes.

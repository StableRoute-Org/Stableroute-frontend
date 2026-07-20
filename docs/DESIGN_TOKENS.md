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

---

## Forced-colors (Windows High Contrast) support

Windows High Contrast mode (and the CSS `forced-colors` media feature) overrides
author-defined colours with a small system palette.  This means:

- **Coloured backgrounds are replaced** by `Canvas`.
- **Box-shadows disappear** — they cannot be used as the sole border signal.
- **Status colours alone are insufficient** — a `danger` badge and an `ok` badge
  look identical unless a non-colour cue (icon, text) is also present.

### Authoring pattern

Follow these three steps when building a new component:

#### 1 — Add a `data-*` hook to the component

Give the root element (and any sub-regions with their own border) a `data-*`
attribute that globals.css can target:

```tsx
// Card example
<section data-card className="border border-neutral-200 …">
  …
  <footer data-card-footer className="border-t …">…</footer>
</section>
```

#### 2 — Add `@media (forced-colors: active)` rules in `globals.css`

Use `ButtonText` for borders, `Canvas`/`CanvasText` for backgrounds/text, and
`Highlight` for focus rings.  **Never use hex values inside this block** — they
will be overridden anyway and may cause contrast failures on non-Windows
implementations.

```css
@media (forced-colors: active) {
  [data-card] {
    border: 1px solid ButtonText;
    outline: none;
  }

  [data-card-footer] {
    border-top: 1px solid ButtonText;
  }
}
```

#### 3 — Replace colour-only status cues with an accompanying icon or text

For components like `Badge` that use colour to signal status, render a
visually-present symbol alongside the label:

```tsx
// Badge — status icons surfaced in forced-colors mode
const forcedColorsIcons = {
  neutral: "",
  ok:      "✓ ",
  warning: "⚠ ",
  danger:  "✕ ",
};

<span
  aria-hidden="true"
  className="mr-0.5 hidden [forced-colors:active]:inline"
>
  {icon}
</span>
```

The `aria-hidden="true"` attribute keeps screen readers silent (the badge label
text already communicates the status).  The Tailwind variant
`[forced-colors:active]:inline` makes the icon visible only when forced-colors
is active.

### `forced-color-adjust: none`

Use **sparingly** — only on small, fully self-contained elements (e.g. custom
checkboxes, radio buttons) where the UA stylesheet would render them unusable.
Never apply it to entire cards or page regions.

### System colour keywords reference

| Keyword | Meaning |
|---------|---------|
| `Canvas` | Page / widget background |
| `CanvasText` | Text on `Canvas` |
| `ButtonText` | Text and borders on interactive controls |
| `Highlight` | Selected text background / focus indicator |
| `HighlightText` | Text on `Highlight` background |
| `LinkText` | Unvisited hyperlink colour |

Full spec: <https://www.w3.org/TR/css-color-4/#css-system-colors>

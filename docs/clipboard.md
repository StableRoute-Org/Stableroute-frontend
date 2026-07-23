# Clipboard Writes

Clipboard writes go through `src/lib/clipboard.ts` rather than calling
`navigator.clipboard.writeText` directly. The async Clipboard API throws (or
rejects) outside a secure context and can also reject when the user or
browser denies permission, so callers must not await it unguarded.

## API

```ts
isClipboardWriteAvailable(): boolean
writeToClipboard(text: string): Promise<
  | { ok: true }
  | { ok: false; reason: "unsupported" | "denied" }
>
```

`isClipboardWriteAvailable` checks `window.isSecureContext` and that
`navigator.clipboard.writeText` exists. `writeToClipboard` runs that same
check before writing and never throws or rejects — permission denials and
missing-API cases both resolve to `{ ok: false, reason }` instead.

## Usage pattern

Callers branch on `result.ok`:

- `api-keys/Client.tsx` clears the one-time secret on success; on failure it
  shows an error toast and renders the secret in a selectable, read-only
  `TextField` so it can still be copied by hand.
- `events/Client.tsx` shows an error toast on failure and expands the event's
  payload `<pre>` block so it's visible and selectable.
- `stats/Client.tsx` confirms successful snapshot copies with a toast; on
  failure it shows an error toast and the exact snapshot in a selectable,
  read-only text area.

Never call `navigator.clipboard.writeText` directly in page/component code —
route it through `writeToClipboard` so insecure-context and permission
failures always surface as a toast plus a manual fallback instead of an
unhandled rejection.

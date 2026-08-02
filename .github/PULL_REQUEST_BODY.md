## Summary

Help's async updates (loading / empty / error / success) were silent for
screen-reader users. This change adds a dedicated **polite live region** to the
`Help` component that announces status transitions as they occur, with a
configurable debounce to coalesce rapid updates.

**What changed**

- `src/components/Help.tsx`
  - Added a screen-reader-only announcement region
    (`<span aria-live="polite" aria-atomic="true" className="sr-only">`)
    populated only when the `status` actually changes.
  - Added a `debounceMs` prop (default **300ms**) so rapid status changes are
    coalesced — the last one wins.
  - Seeded the previous-status ref with the initial status so the initial
    mount is never announced.
  - Pending debounced announcements are cancelled on re-render and on unmount.
  - No visual change — the visible status text and layout are unchanged.
- `src/components/__tests__/Help.test.tsx`
  - Added coverage for initial-mount silence, success/failure announcements,
    optional message handling, debounce coalescing, custom debounce windows,
    immediate (`debounceMs={0}`) announcements, ARIA attributes, and unmount
    timer cleanup.
- `docs/help.md`
  - Documented the ARIA contract, status model, and debounce semantics.

## Related Issue

Closes the "Announce help updates through an ARIA live region" issue.

## Type Of Change

- [ ] Bug fix
- [x] Feature
- [x] Documentation
- [ ] Refactor or maintenance

## Testing

### Help test suite

```
PASS src/components/__tests__/Help.test.tsx
  Help
    visible status text
      √ renders its trigger children
      √ renders the loading state
      √ renders the empty state
      √ renders the error state with the provided message
      √ renders the success state
      √ renders the success state with an optional message appended
      √ keeps states mutually exclusive (only one status message present)
      √ exposes the status for assistive technology via aria-live
      √ omits the trailing message segment when no message is provided
      √ does not re-render when props are referentially stable (memoized)
    live region announcements
      √ is empty on initial mount (no announcement)
      √ switches to loading → success after debounce
      √ announces loading → error with the provided message
      √ announces loading → success with an optional message
      √ announces empty → success transitions
      √ coalesces rapid successive status changes (last one wins)
      √ does not announce when status stays the same
      √ respects a custom debounce window
      √ announces immediately when debounceMs is 0
      √ has aria-live="polite" and aria-atomic="true" on the live region
      √ has class sr-only on the live region
      √ cancels the pending debounced announcement when unmounted

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
Snapshots:   0 total
```

### All Help-related suites

```
PASS src/components/__tests__/ShortcutsHelp.test.tsx
PASS src/components/__tests__/Help.test.tsx

Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total
Snapshots:   0 total
```

- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run build`

## Contributor Checklist

- [x] Branch name follows `type/area-slug` where possible (`a11y/help-91-live`).
- [x] Tests were added or updated for new UI or behaviour.
- [x] Documentation was updated for visible or API-facing changes.
- [x] Accessibility was considered according to the [Accessibility Conformance Statement](docs/ACCESSIBILITY.md) (keyboard, screen-reader, color contrast, and reduced motion).
- [x] No unrelated CI workflow changes are included.

## Notes For Reviewers

The `Help` component exposes two complementary regions:

1. A visible `<span role="status" aria-live="polite">` for sighted users
   (unchanged behaviour).
2. A `sr-only` announcement region
   (`aria-live="polite"`, `aria-atomic="true"`) that only carries text when the
   status changes, with the last change winning within the debounce window.

---

💬 Join the [StableRoute Discord](https://discord.gg/37aCpusvx) for questions, reviews, and faster merges.


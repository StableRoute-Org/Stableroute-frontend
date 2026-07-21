# Loading Region Accessibility

Dynamic list pages should expose one polite live region around loading, empty,
and loaded list states. Keep `aria-live="polite"` and `aria-atomic="true"` on
that region so assistive technology announces the state transition once.

While the initial fetch is pending, set `aria-busy="true"` on the live region.
After the request resolves with data, an empty result, or an error, set
`aria-busy="false"`. Error copy should remain outside the polite list region and
use `role="alert"` for assertive announcement.

## Filter Control Groups

List pages that expose more than one control for shaping the list must group
those controls in a `<fieldset>` with a visible `<legend>`. Loose sibling inputs
and buttons are announced as an unrelated run of controls, with no shared
context telling a screen-reader user what they act on. The fieldset gives the
group an accessible name (`role="group"`), and the visible legend gives sighted
users the same grouping cue.

Strip the browser's default fieldset chrome with `border-0 p-0` and keep the
existing layout on the fieldset itself (`flex`, `gap-*`, and so on) so grouping
is a semantics-only change.

The event log applies this in `src/app/events/Client.tsx`: the type filter,
`Refresh now`, the live-refresh toggle, `Export CSV`, and `Clear filters` all
sit inside a fieldset legended **Event log filters**.

`Export CSV` is an action rather than a filter, but it exports the _filtered_
rows and its disabled state is derived from the filtered result — so it belongs
with the controls that shape that result rather than floating outside the group
as the only ungrouped sibling.

### Clear-all Controls

A group that can be narrowed should offer a single reset control:

- Disable it whenever no filter is active, so assistive tech reports it as
  unavailable instead of offering a no-op. Compute "active" from the trimmed
  filter value — a whitespace-only entry narrows nothing and must read as
  inactive.
- Announce the reset through the **existing** polite live region rather than
  adding a second one. The event log renders an `sr-only` paragraph inside the
  `aria-live="polite"` list region; because that region is `aria-atomic="true"`,
  the message is announced together with the restored result count.
- Drop the announcement as soon as the user filters again, so a stale
  "Filters cleared" string is never re-announced on the next atomic update.

## Route Navigation

After client-side navigation, the page title is announced in a `sr-only`
`aria-live="polite"` region, and focus is moved to the `#main-content` landmark.
This ensures screen-reader users are aware of the route change and can
immediately interact with the page content.

## Skeleton Strategy

By default, unmatched routes use `src/app/loading.tsx`, which provides a generic 3-line skeleton placeholder. For dashboard segments that fetch large data sets (`/pairs`, `/events`, `/stats`), we use per-route `loading.tsx` files.

### Design Goals

1. **No Layout Shift**: The skeleton's CSS matches the exact layout of the real page's `main` element. It includes the same structure (e.g. `PageHeading`) and `gap` values.
2. **Accessible**: The `tabIndex={-1}` is preserved on `main#main-content` for focus management, and `Spinner` provides hidden screen reader text via `sr-only`.
3. **Reusability**: Skeletons use standard Tailwind CSS classes (`animate-pulse`, `bg-neutral-200`) to maintain design consistency without adding new components.

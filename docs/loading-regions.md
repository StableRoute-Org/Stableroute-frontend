# Loading Region Accessibility

Dynamic list pages should expose one polite live region around loading, empty,
and loaded list states. Keep `aria-live="polite"` and `aria-atomic="true"` on
that region so assistive technology announces the state transition once.

While the initial fetch is pending, set `aria-busy="true"` on the live region.
After the request resolves with data, an empty result, or an error, set
`aria-busy="false"`. Error copy should remain outside the polite list region and
use `role="alert"` for assertive announcement.

## Route Navigation

After client-side navigation, the page title is announced in a `sr-only`
`aria-live="polite"` region, and focus is moved to the `#main-content` landmark.
This ensures screen-reader users are aware of the route change and can
immediately interact with the page content.

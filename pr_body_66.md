## Summary

Expands the settings page from a near-empty stub into a useful operator surface with an API base display and a live appearance preview that shows the effect of light/dark/system theme choices.

## Changes

### Settings Page (src/app/settings/page.tsx)
- Converted to a client component for interactive preview state
- Added AppearancePreview component showing a live themed sample card (text, muted text, colored swatches) that reacts to theme changes
- Added ApiBaseRow component displaying the configured NEXT_PUBLIC_STABLEROUTE_API_BASE (or localhost default) inside a reusable Card
- Both new sections use the shared Card component for consistent layout
- Document title set via useEffect (preserving 'Settings — StableRoute')
- Existing ThemeToggle, #main-content skip target, and focus:outline-none preserved

### Tests (src/app/settings/page.test.tsx)
- Creates a new comprehensive test file for the settings page
- Asserts heading, ThemeToggle buttons, appearance preview content, and API base row render correctly

Closes #66
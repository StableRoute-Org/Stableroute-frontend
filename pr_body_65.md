## Summary

Replaces the stale wallet-related copy on the landing page and surfaces all primary dashboard routes as navigable cards.

## Changes

### Home Page (src/app/page.tsx)
- Replaced "Connect your Stellar wallet..." paragraph with operator dashboard copy
- Added navigation cards for all primary routes using the shared Card component:
  - /quote, /pairs, /stats (existing links preserved)
  - /admin, /api-keys, /events, /webhooks, /docs (new cards)
- Every link has focus-visible:outline styling for accessibility
- Main content skip target (#main-content + focus:outline-none) preserved

### Tests (src/__tests__/page.test.tsx)
- Extended to assert all 8 route links render with correct href
- Verifies no stale "Connect your Stellar wallet" copy remains
- Checks operator dashboard description renders
- Confirms skip-target accessibility attributes

Closes #65
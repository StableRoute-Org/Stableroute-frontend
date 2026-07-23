# Accessibility Conformance Statement

StableRoute is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to achieve an inclusive experience across the StableRoute frontend interface.

---

## Conformance Target

Our target conformance level is **WCAG 2.1 Level AA** (Web Content Accessibility Guidelines 2.1, Level AA).

This target applies to all user-facing routes and core workflow interfaces in `Stableroute-frontend`, including route navigation, liquidity pair management, path routing quotes, status dashboards, admin controls, API keys, audit logs, webhooks, user settings, and documentation pages.

---

## Supported & Tested Matrix

We aim to support a wide array of browser and assistive technology combinations. Our primary test matrix includes:

### Assistive Technologies

- **NVDA** (NonVisual Desktop Access) on Windows
- **JAWS** (Job Access With Speech) on Windows
- **VoiceOver** on macOS and iOS
- **TalkBack** on Android
- **Keyboard-only navigation** (Tab, Shift+Tab, Enter, Space, Escape, arrow keys)

### Desktop Browsers

- **Google Chrome** (latest 2 versions)
- **Mozilla Firefox** (latest 2 versions & ESR)
- **Apple Safari** (latest 2 versions)
- **Microsoft Edge** (latest 2 versions)

### Mobile Browsers

- **Safari on iOS / iPadOS**
- **Chrome on Android**

---

## Feedback & Contact Channel

We welcome feedback on the accessibility of the StableRoute frontend. If you encounter accessibility barriers, experience issues with screen readers or keyboard navigation, or have suggestions for improvement, please contact us through any of the following channels:

- **GitHub Issues**: Open an issue titled `A11Y: <Brief Description>` in [StableRoute-Org/Stableroute-frontend](https://github.com/StableRoute-Org/Stableroute-frontend/issues) labeled `type/docs` or `area/accessibility`.
- **Email**: Email our team at `accessibility@stableroute.org` or `security@stableroute.org`.
- **Community Discord**: Connect directly with maintainers in the [StableRoute Discord](https://discord.gg/37aCpusvx).

We aim to respond to accessibility reports within 2 business days.

---

## Implemented Accessibility Architecture

StableRoute incorporates proactive accessibility patterns throughout the codebase:

### 1. Screen Reader Navigation & Route Announcements

- **Route Announcer**: [`src/components/RouteAnnouncer.tsx`](../src/components/RouteAnnouncer.tsx) monitors client-side route changes using Next.js App Router navigation hooks. On route change, it updates a `sr-only` polite live region (`aria-live="polite"`, `aria-atomic="true"`) to announce the new page title (e.g., `"Quotes loaded."`).
- **Focus Management**: Upon route navigation, focus is automatically moved to the `<main id="main-content" tabIndex={-1}>` landmark container, enabling screen-reader and keyboard users to immediately interact with new page content.

### 2. Reduced Motion Support (OS & Browser Settings)

- **CSS Overrides**: When users enable "Reduce Motion" in their OS or browser settings (`@media (prefers-reduced-motion: reduce)` in [`src/app/globals.css`](../src/app/globals.css)), CSS animations and transitions are collapsed to near-zero duration (`0.01ms`).
- **DOM & Accessibility State Preservation**: As verified in [`src/components/__tests__/ReducedMotionA11y.test.tsx`](../src/components/__tests__/ReducedMotionA11y.test.tsx), structural accessibility markers are strictly retained:
  - `<Spinner>` SVG rotation stops, but `role="status"` and visually hidden `<span class="sr-only">Loading</span>` labels remain intact.
  - Skeleton loading states (`src/app/loading.tsx`) maintain landmark focus structure while disabling CSS pulsing (`animate-pulse`).

### 3. Dynamic Loading & Live Regions

- **Polite Live Regions**: Dynamic list updates (loading, empty, and populated states) across `/pairs`, `/events`, `/api-keys`, and `/webhooks` are wrapped in single `aria-live="polite"` containers with `aria-busy` state management, avoiding double announcements (see [`docs/loading-regions.md`](loading-regions.md)).
- **Assertive Alerts**: Error states and high-priority toast notifications use `role="alert"` for immediate screen-reader announcement.
- **Filter Groups**: Multi-control filter bars are semantically grouped using `<fieldset>` and visible `<legend>` elements (e.g., in `src/app/events/Client.tsx`).

### 4. Forms & Accessible UI Controls

- **Labeled Inputs**: Form controls utilize [`TextField`](../src/components/TextField.tsx) with explicit `id` / `htmlFor` association and `aria-describedby` wiring for error messages.
- **Icon-Only Buttons**: `IconButton` mandates explicit `aria-label` props.
- **Modal Dialogs**: [`ConfirmDialog`](../src/components/ConfirmDialog.tsx) traps focus within the open modal and listens for `Escape` key dismissals.
- **Keyboard Shortcuts & Command Palette**: Interactive overlays ([`KeyboardShortcutsHelp`](../src/components/KeyboardShortcutsHelp.tsx) and [`CommandPalette`](../src/components/CommandPalette.tsx)) support keyboard triggers (`?` and `Cmd/Ctrl+K`).

### 5. Document Structure & Semantics

- The root document layout ([`src/app/layout.tsx`](../src/app/layout.tsx)) declares explicit `lang="en" dir="ltr"` attributes.
- Page headings maintain logical hierarchy starting with a single `<h1>` per route (`PageHeading.tsx`).

---

## Register of Known Accessibility Gaps

While we strive for full WCAG 2.1 AA compliance, we maintain an open register of known gaps and ongoing remediation efforts:

| Affected Route / Component                     | Description of Gap                                                                                                                     | Workaround / Current State                                                                             | Tracking Issue                                                             |
| :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| **`/stats` Dashboard**                         | Complex metric chart graphics lack an interactive screen-reader readable data table alternative.                                       | Numeric stat tiles provide text equivalents for primary key performance indicators.                    | [#401](https://github.com/StableRoute-Org/Stableroute-frontend/issues/401) |
| **`CommandPalette` / `KeyboardShortcutsHelp`** | Opening modal overlays while another overlay is open can result in nested focus ring competition.                                      | Pressing `Escape` cleanly dismisses active overlay and restores focus to main content trigger.         | [#312](https://github.com/StableRoute-Org/Stableroute-frontend/issues/312) |
| **`ThemeToggle`**                              | High Contrast mode (`forced-colors: active`) in custom dark-mode theme gradient buttons can obscure selection outlines in legacy Edge. | Default browser focus outlines remain visible; theme follows system preference.                        | [#288](https://github.com/StableRoute-Org/Stableroute-frontend/issues/288) |
| **`/events` Audit Log**                        | Column header sorting controls lack explicit `aria-sort="ascending                                                                     | descending"` state attributes on table headers.                                                        | Visual sort icons and filter status text describe current list ordering.   | [#350](https://github.com/StableRoute-Org/Stableroute-frontend/issues/350) |
| **CI Test Suite**                              | Automated WCAG rule assertions (`jest-axe`) are not yet integrated into continuous integration build steps.                            | Smoke test suite (`ReducedMotionA11y.test.tsx`, `accessibilityDocs.test.ts`) covers key ARIA patterns. | [#808](https://github.com/StableRoute-Org/Stableroute-frontend/issues/808) |

---

## Continuous Improvement & Audit Schedule

This statement was published in July 2026 and is reviewed quarterly or upon major feature releases. We conduct periodic manual testing with assistive technologies and run automated checks as part of our core development workflow.

---
type: Feature
title: "Add a PWA web app manifest and installable icon set"
labels: type:feature, area:pwa, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a PWA web app manifest and installable icon set

### Description
`public/` currently holds only `theme-init.js`, and `src/app/layout.tsx` declares no manifest or icon metadata, so the dashboard cannot be installed or pinned. Add a Next.js `manifest` route plus maskable icons so operators can install StableRoute as a standalone app.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `src/app/manifest.ts` exporting name, short_name, start_url, display `standalone`, and theme/background colors matching the tokens in `src/app/globals.css`.
- Ship 192px and 512px maskable PNG icons under `public/` and wire `icons` into the `metadata` export in `src/app/layout.tsx`.
- Keep the theme color consistent for both light and dark schemes.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/pwa-web-app-manifest`
- **Write code in:** `src/app/manifest.ts`
- **Write comprehensive tests in:** `src/__tests__/manifest.test.ts`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(pwa): add web app manifest and installable icon set`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Serve robots.txt and a generated sitemap from route handlers"
labels: type:feature, area:seo, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Serve robots.txt and a generated sitemap from route handlers

### Description
The app exposes no `robots.txt` or sitemap, so crawlers have no guidance about the public pages (`src/app/page.tsx`, `src/app/about/page.tsx`, `src/app/docs/page.tsx`) versus operator-only routes such as `src/app/api-keys` and `src/app/admin`. Generate both from the shared route catalogue in `src/lib/routes.ts`.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `src/app/robots.ts` and `src/app/sitemap.ts` using the Next.js metadata file conventions.
- Derive sitemap entries from `src/lib/routes.ts` and mark operator-only routes as disallowed.
- Read the site origin from a documented environment variable with a safe fallback.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/seo-robots-sitemap`
- **Write code in:** `src/app/sitemap.ts`
- **Write comprehensive tests in:** `src/__tests__/sitemap.test.ts`
- **Add documentation:** `docs/seo.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(seo): serve robots.txt and generated sitemap route handlers`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Generate a dynamic Open Graph preview image for shared links"
labels: type:feature, area:metadata, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Generate a dynamic Open Graph preview image for shared links

### Description
`src/app/layout.tsx` declares `openGraph` and `twitter` metadata but no image, so shared links render as bare text with a `summary` card. Add an `ImageResponse`-based OG image and upgrade the Twitter card to `summary_large_image`.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `src/app/opengraph-image.tsx` rendering the StableRoute wordmark and tagline at 1200x630.
- Update the `metadata` export in `src/app/layout.tsx` to reference the image and switch `twitter.card`.
- Keep the image edge-renderable with no external font or asset fetches.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/metadata-opengraph-image`
- **Write code in:** `src/app/opengraph-image.tsx`
- **Write comprehensive tests in:** `src/__tests__/openGraphImage.test.tsx`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(metadata): generate dynamic Open Graph preview image`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Let operators pin favourite pairs to the top of the pairs list"
labels: type:feature, area:pairs, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Let operators pin favourite pairs to the top of the pairs list

### Description
`src/app/pairs/Client.tsx` renders every registered pair in a flat list, so operators watching a handful of corridors must re-find them on each visit. Add a pin control that persists favourites via the existing `src/lib/useLocalStorage.ts` hook and floats them into a separate section.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Store pinned pair identifiers under a namespaced key alongside the other persisted keys in `src/lib/config.ts`.
- Render a "Pinned" group above the main list and keep pinning consistent with the existing search filter.
- Give the pin toggle an `aria-pressed` state and an accessible name that names the pair.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/pairs-pinned-favourites`
- **Write code in:** `src/app/pairs/Client.tsx`
- **Write comprehensive tests in:** `src/app/pairs/page.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(pairs): pin favourite pairs to the top of the list`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a danger zone that clears all locally stored app state"
labels: type:feature, area:settings, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a danger zone that clears all locally stored app state

### Description
The app persists theme, recent quotes and other preferences through `src/lib/useLocalStorage.ts` and `src/lib/theme.ts`, but `src/app/settings/Client.tsx` offers no way to reset them when a shared browser or corrupted value causes odd behaviour. Add a confirmed "Reset local data" action.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Enumerate the owned storage keys in one place rather than calling `localStorage.clear()`.
- Gate the action behind `src/components/ConfirmDialog.tsx` and confirm completion with a toast.
- Restore the default theme immediately after the reset without a full page reload.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/settings-reset-local-state`
- **Write code in:** `src/app/settings/Client.tsx`
- **Write comprehensive tests in:** `src/app/settings/page.test.tsx`
- **Add documentation:** `docs/theme-storage.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(settings): add danger zone to clear local app state`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a shared Tooltip component for truncated and icon-only controls"
labels: type:enhancement, area:ui-components, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a shared Tooltip component for truncated and icon-only controls

### Description
`src/components/IconButton.tsx` and the truncated identifiers on `src/app/api-keys/Client.tsx` rely on the native `title` attribute, which is invisible to keyboard users and unstyled. Add a `Tooltip` primitive to the shared component library and adopt it in those call sites.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Show on hover and focus, hide on Escape and blur, and wire the trigger with `aria-describedby`.
- Respect `prefers-reduced-motion` in line with the existing shared component styles.
- Document the component in the styleguide alongside the other primitives.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/ui-components-tooltip`
- **Write code in:** `src/components/Tooltip.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Tooltip.test.tsx`
- **Add documentation:** `docs/STYLEGUIDE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(ui): add shared Tooltip component with focus and Escape handling`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Group the docs page endpoint sections behind an accessible Tabs primitive"
labels: type:enhancement, area:docs-page, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Group the docs page endpoint sections behind an accessible Tabs primitive

### Description
`src/app/docs/page.tsx` stacks every endpoint group into one long scroll, making it hard to compare related endpoints. Introduce a reusable `Tabs` component and use it to split the page into endpoint categories.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Implement the WAI-ARIA tabs pattern: `role="tablist"`, arrow-key roving focus, and `aria-controls`/`aria-selected` wiring.
- Reflect the active tab in the URL hash so deep links to an endpoint group still work.
- Keep all panel content in the DOM-rendered markup so in-page search remains usable.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/docs-page-tabs`
- **Write code in:** `src/components/Tabs.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Tabs.test.tsx`
- **Add documentation:** `docs/STYLEGUIDE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(docs): group endpoint sections with an accessible Tabs component`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Move the raw palette values into the tailwind.config.ts theme extension"
labels: type:refactor, area:styling, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Move the raw palette values into the tailwind.config.ts theme extension

### Description
`tailwind.config.ts` only extends `fontFamily`, so components such as `src/components/Badge.tsx` and `src/components/StatTile.tsx` hard-code default Tailwind palette shades directly in class strings. Promote the documented tokens into `theme.extend.colors` and migrate the components onto semantic names.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Define semantic colour keys (surface, muted, accent, danger, success) mapped to the CSS variables already documented in `docs/DESIGN_TOKENS.md`.
- Replace literal shade utilities in the shared components with the semantic equivalents, preserving light and dark output.
- No visual regressions: assert the resulting class names in the component tests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/styling-semantic-color-tokens`
- **Write code in:** `tailwind.config.ts`
- **Write comprehensive tests in:** `src/components/__tests__/Badge.test.tsx`
- **Add documentation:** `docs/DESIGN_TOKENS.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(styling): move palette values into the tailwind theme extension`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Remove the repeated Button import in the event log client module"
labels: type:refactor, area:events, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Remove the repeated Button import in the event log client module

### Description
`src/app/events/Client.tsx` imports `Button` from `@/components/Button` three separate times at the top of the file, a leftover from successive feature merges. Duplicate named imports of the same binding are a redeclaration error and should be collapsed to a single import before they break the build.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Collapse the import block in `src/app/events/Client.tsx` to one import per module and keep the import ordering consistent with the rest of `src/app`.
- Sweep the other client modules under `src/app` for the same duplication pattern.
- Add an ESLint rule to `.eslintrc.json` that fails the build on duplicate imports so this cannot recur.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/events-duplicate-imports`
- **Write code in:** `src/app/events/Client.tsx`
- **Write comprehensive tests in:** `src/app/events/page.test.tsx`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(events): collapse duplicate Button imports and lint against recurrence`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add tests for the AppShellExtras overlay composition"
labels: type:test, area:app-shell, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add tests for the AppShellExtras overlay composition

### Description
`src/components/AppShellExtras.tsx` mounts both `CommandPalette` and `KeyboardShortcutsHelp` into the root layout but has no test file of its own, so a regression that drops one overlay would go unnoticed. Cover the composition and the interaction between the two overlays.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Assert both overlays mount and that neither renders visible content until its trigger key fires.
- Cover opening the palette with Cmd/Ctrl+K and the shortcuts sheet with `?`, including that they do not stack open simultaneously.
- Assert no shortcut fires while focus sits in a text input.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/app-shell-extras-coverage`
- **Write code in:** `src/components/AppShellExtras.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/AppShellExtras.test.tsx`
- **Add documentation:** `docs/STYLEGUIDE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(app-shell): cover AppShellExtras overlay composition and shortcuts`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add tests for the root and route-segment error boundary components"
labels: type:test, area:error-boundaries, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add tests for the root and route-segment error boundary components

### Description
`src/app/error.tsx`, `src/app/quote/error.tsx` and `src/app/events/error.tsx` are the only surfaces users see when a segment throws, yet none of them has a test file. Add tests covering the rendered message, the reset action and the redaction behaviour.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Assert each boundary renders a user-safe message and never surfaces the raw `Error.stack` or backend detail.
- Assert the reset callback is invoked when the retry control is activated.
- Cover the digest-present and digest-absent branches.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/error-boundaries-coverage`
- **Write code in:** `src/app/error.tsx`
- **Write comprehensive tests in:** `src/app/__tests__/errorBoundaries.test.tsx`
- **Add documentation:** `ARCHITECTURE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(errors): cover root and segment error boundary rendering and reset`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Set cross-origin isolation and frame-ancestors headers in next.config"
labels: type:security, area:http-headers, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Set cross-origin isolation and frame-ancestors headers in next.config

### Description
The header set defined in `next.config.ts` does not include the cross-origin isolation family, so the dashboard remains embeddable and window-openable from untrusted origins. Add `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy` and a CSP `frame-ancestors` directive.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Set `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Resource-Policy: same-origin` for all routes.
- Add `frame-ancestors 'none'` to the CSP so clickjacking is blocked even where `X-Frame-Options` is ignored.
- Extend `src/__tests__/nextConfigHeaders.test.ts` to assert each directive is present exactly once.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/http-headers-cross-origin-isolation`
- **Write code in:** `next.config.ts`
- **Write comprehensive tests in:** `src/__tests__/nextConfigHeaders.test.ts`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`security(headers): add cross-origin isolation and frame-ancestors directives`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Block committed secrets with a pre-commit hook and a CI secret scan"
labels: type:security, area:repo-tooling, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Block committed secrets with a pre-commit hook and a CI secret scan

### Description
The repo handles API keys and webhook secrets through `src/app/api-keys/Client.tsx` and `src/app/webhooks/Client.tsx`, but nothing prevents a contributor from committing a real `.env` value or pasted key. Add a pre-commit hook plus a CI scan step in `.github/workflows/ci.yml`.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Wire a lightweight pre-commit hook that runs `npm run lint` on staged files and rejects staged `.env*` files and high-entropy key patterns.
- Add a secret-scanning job to `.github/workflows/ci.yml` that fails the build on a match.
- Keep the hook opt-out-able for maintainers via a documented environment variable.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/repo-tooling-secret-scanning`
- **Write code in:** `scripts/check-staged-secrets.js`
- **Write comprehensive tests in:** `scripts/__tests__/checkStagedSecrets.test.js`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`security(tooling): add pre-commit and CI secret scanning`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Add a CODE_OF_CONDUCT with enforcement contacts"
labels: type:docs, area:community, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a CODE_OF_CONDUCT with enforcement contacts

### Description
The repo ships `CONTRIBUTING.md` and `SECURITY.md` but no code of conduct, so contributors arriving through the GrantFox campaign have no stated behavioural standard or reporting path. Add one and link it from the contributor entry points.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Base the document on Contributor Covenant 2.1 with StableRoute-specific reporting contacts and the Discord channel.
- Link it from `CONTRIBUTING.md`, `README.md` and `.github/ISSUE_TEMPLATE/grantfox.md`.
- Describe the enforcement ladder and expected response window.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/community-code-of-conduct`
- **Write code in:** `CODE_OF_CONDUCT.md`
- **Write comprehensive tests in:** `src/__tests__/repoDocs.test.ts`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs(community): add code of conduct and link it from contributor docs`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Publish an accessibility conformance statement and known-gaps register"
labels: type:docs, area:accessibility-docs, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Publish an accessibility conformance statement and known-gaps register

### Description
The codebase carries substantial accessibility work — `src/components/RouteAnnouncer.tsx`, the reduced-motion styles covered by `src/components/__tests__/ReducedMotionA11y.test.tsx`, and the loading regions in `docs/loading-regions.md` — but none of it is summarised for users or contributors. Publish a conformance statement.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- State the target conformance level, the tested assistive-technology and browser matrix, and the feedback channel.
- Maintain a table of known gaps with the affected route or component and a tracking issue.
- Link the statement from `README.md` and the PR checklist in `.github/PULL_REQUEST_TEMPLATE.md`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/accessibility-conformance-statement`
- **Write code in:** `docs/ACCESSIBILITY.md`
- **Write comprehensive tests in:** `src/__tests__/accessibilityDocs.test.ts`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs(a11y): publish accessibility conformance statement and gaps register`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Wrap the event log filter controls in a labelled fieldset with a clear-all action"
labels: type:a11y, area:events-filters, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Wrap the event log filter controls in a labelled fieldset with a clear-all action

### Description
`src/app/events/Client.tsx` renders the type filter, live-refresh toggle and expand controls as loose sibling elements with no grouping, so screen-reader users hear a run of unrelated controls with no shared context. Group them into a labelled `fieldset` and add a clear-all filters control.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Wrap the controls in `<fieldset>` with a visible `<legend>` and keep the existing layout via utility classes.
- Add a "Clear filters" button that is disabled when no filter is active and announces the reset through the existing live region.
- Preserve the current filter behaviour and the `typeFilter` state shape.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/events-filters-fieldset`
- **Write code in:** `src/app/events/Client.tsx`
- **Write comprehensive tests in:** `src/app/events/page.test.tsx`
- **Add documentation:** `docs/loading-regions.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix(a11y): group event log filters in a labelled fieldset with clear-all`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Run Lighthouse CI against the built app with performance budgets"
labels: type:enhancement, area:ci-performance, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Run Lighthouse CI against the built app with performance budgets

### Description
`.github/workflows/ci.yml` verifies lint, tests and the bundle budget from `.bundle-budget.json`, but nothing measures runtime performance, so a regression in Largest Contentful Paint or Cumulative Layout Shift ships unnoticed. Add a Lighthouse CI job over the key routes.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Start the production server from `npm run build && npm start` and audit `/`, `/pairs`, `/events` and `/docs`.
- Define assertion thresholds in a committed config and fail the job when a category score drops below budget.
- Upload the HTML reports as a workflow artifact for reviewers.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/ci-performance-lighthouse`
- **Write code in:** `.github/workflows/ci.yml`
- **Write comprehensive tests in:** `scripts/__tests__/lighthouseConfig.test.js`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci(performance): add Lighthouse CI job with route performance budgets`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
++++++
---
type: Feature
title: "Statically prerender the about and docs routes at build time"
labels: type:enhancement, area:rendering, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Statically prerender the about and docs routes at build time

### Description
`src/app/about/page.tsx` and `src/app/docs/page.tsx` render entirely static content but carry no rendering directives, so they are re-evaluated per request behind the shared client shell. Mark them as fully static and trim any client-only imports that force dynamic rendering.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Export `dynamic = "force-static"` (and a `revalidate` where appropriate) from both route modules.
- Move any interactive fragments into small client components so the page shells stay server-rendered.
- Confirm the routes appear as prerendered static content in the `npm run build` route summary and record the before/after output in the PR.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/rendering-static-about-docs`
- **Write code in:** `src/app/docs/page.tsx`
- **Write comprehensive tests in:** `src/app/docs/page.test.tsx`
- **Add documentation:** `ARCHITECTURE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`perf(rendering): statically prerender the about and docs routes`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.

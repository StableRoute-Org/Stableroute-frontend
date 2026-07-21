---
type: Feature
title: "Add a service status page that probes API health and reports latency"
labels: type:feature, area:status-page, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a service status page that probes API health and reports latency

### Description
`src/components/ConnectionBanner.tsx` only tells operators that the API is unreachable, with no detail about which base URL was probed or how slow it is. A dedicated `/status` route can surface the resolved base from `src/lib/config.ts`, the last probe result, and a measured round-trip time. This gives operators a single place to confirm connectivity before filing a bug.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `src/app/status/page.tsx` and `src/app/status/Client.tsx`, registering the route in `src/lib/routes.ts` so the header nav and command palette pick it up.
- Probe through `apiFetch` in `src/lib/apiClient.ts` with a short `timeoutMs`, measuring elapsed time with `performance.now()`.
- Render the resolved API base, HTTP status, latency in milliseconds, and last-checked time via `src/components/TimeAgo.tsx`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/status-page-health-probe`
- **Write code in:** `src/app/status/Client.tsx`
- **Write comprehensive tests in:** `src/app/status/page.test.tsx`
- **Add documentation:** `docs/status-page.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(status): add API health and latency status page`

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
title: "Add a Copy as cURL control to each endpoint on the docs page"
labels: type:feature, area:docs-page, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a Copy as cURL control to each endpoint on the docs page

### Description
`src/app/docs/page.tsx` lists the consumed StableRoute HTTP endpoints as static text, so operators must hand-assemble requests when reproducing an issue. A per-endpoint "Copy as cURL" button can emit a ready-to-run command using the resolved base from `src/lib/config.ts`. Reuse `src/lib/clipboard.ts` so the existing secure-context and permission guards apply.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a `buildCurlCommand(method, path, body?)` helper so command construction is unit-testable independently of the page.
- Render the control with `src/components/IconButton.tsx` and confirm success through the toast context in `src/components/ToastProvider.tsx`.
- Never inline a real API key in the generated command; use a `$STABLEROUTE_API_KEY` placeholder.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/docs-page-copy-curl`
- **Write code in:** `src/app/docs/page.tsx`
- **Write comprehensive tests in:** `src/app/docs/page.test.tsx`
- **Add documentation:** `docs/api-client.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(docs): add copy-as-curl control to endpoint reference`

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
title: "Add a compact density mode toggle to the settings appearance section"
labels: type:feature, area:settings, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a compact density mode toggle to the settings appearance section

### Description
Operators scanning long tables in `src/app/events/Client.tsx` and `src/app/pairs/Client.tsx` see the same generous padding as marketing pages. A density preference persisted alongside theme would let them switch to a compact layout. `src/lib/useLocalStorage.ts` already provides the persistence primitive.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Persist `comfortable | compact` under a dedicated storage key and apply a `data-density` attribute on the root element from `src/app/layout.tsx`.
- Add density-aware spacing utilities in `tailwind.config.ts` and consume them in `src/components/Card.tsx` and the list pages.
- Extend the appearance section of `src/app/settings/Client.tsx` with a labelled radio group, not an unlabelled button.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/settings-density-mode`
- **Write code in:** `src/app/settings/Client.tsx`
- **Write comprehensive tests in:** `src/app/settings/page.test.tsx`
- **Add documentation:** `docs/DESIGN_TOKENS.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(settings): add compact density preference`

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
title: "Add JSON and CSV download of the stats snapshot"
labels: type:feature, area:stats, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add JSON and CSV download of the stats snapshot

### Description
`src/app/stats/Client.tsx` renders router metrics as `StatTile` values that cannot be exported for reporting. Adding download controls lets operators capture a point-in-time snapshot with its timestamp. Serialisation should reuse the helpers in `src/lib/format.ts` for the human-readable CSV column.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Build the file client-side with `Blob` and an object URL, revoking the URL after the download to avoid leaks.
- Include both the raw numeric value and the formatted display value per metric, plus a captured-at ISO timestamp.
- Keep the serialisation logic in a pure exported function so it can be tested without the DOM download path.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b feature/stats-snapshot-export`
- **Write code in:** `src/app/stats/Client.tsx`
- **Write comprehensive tests in:** `src/app/stats/page.test.tsx`
- **Add documentation:** `docs/stats-export.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(stats): add JSON and CSV snapshot download`

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
title: "Group navigation links into labelled sections using route metadata"
labels: type:enhancement, area:navigation, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Group navigation links into labelled sections using route metadata

### Description
`src/lib/routes.ts` exposes a flat `ROUTES` map, so `src/components/Header.tsx` and `src/components/CommandPalette.tsx` render ten peer links with no grouping. Adding a `group` field ("Routing", "Operations", "Reference") lets both surfaces render section headers. This scales as more operator routes are added.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Extend the `ROUTES` entries with a typed `group` union and export a `getRoutesByGroup()` helper that preserves declaration order.
- Render palette group headings as non-focusable `role="presentation"` separators so keyboard navigation still moves only between options.
- Keep `src/lib/__tests__/routes.test.ts` passing and assert every route belongs to exactly one group.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/navigation-route-groups`
- **Write code in:** `src/lib/routes.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/routes.test.ts`
- **Add documentation:** `ARCHITECTURE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(nav): group routes into labelled navigation sections`

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
title: "Add a retry action to the segment and global error views"
labels: type:enhancement, area:error-handling, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a retry action to the segment and global error views

### Description
`src/components/SegmentError.tsx`, `src/app/error.tsx`, `src/app/quote/error.tsx`, and `src/app/events/error.tsx` render a failure message but leave recovery to a manual page reload. Next.js hands each boundary a `reset()` callback that re-renders the segment without a full navigation. Wiring it to a visible button turns a dead end into a one-click recovery.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Accept and invoke the `reset` prop in `SegmentError` and expose it as a primary `Button` from `src/components/Button.tsx`.
- Disable the button and show in-flight state while a retry is pending so repeated clicks cannot stack.
- Keep the existing message-sanitisation behaviour intact; retry must not re-expose raw backend errors.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/error-boundary-retry-action`
- **Write code in:** `src/components/SegmentError.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/SegmentError.test.tsx`
- **Add documentation:** `ARCHITECTURE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(errors): add retry action to segment and global error boundaries`

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
title: "Resolve the visitor locale instead of hard-coding en-US in the format helpers"
labels: type:enhancement, area:formatting, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Resolve the visitor locale instead of hard-coding en-US in the format helpers

### Description
`src/lib/format.ts` pins `"en-US"` in `formatNumber`, `formatQuoteRateDisplay`, and `formatTimestamp`, so operators outside the US see unfamiliar separators and date ordering. The helpers should accept an optional locale and default to a resolved value. Hydration safety matters because the server and client can disagree on the resolved locale.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a `resolveLocale()` helper that prefers an explicit argument, then a stored preference, then a stable server-safe fallback.
- Render locale-dependent output only after mount, or `suppressHydrationWarning` the affected nodes, to avoid hydration mismatch warnings.
- Keep existing call sites in `src/app/stats/Client.tsx` and `src/components/TimeAgo.tsx` working without signature churn.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b enhancement/format-locale-resolution`
- **Write code in:** `src/lib/format.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/format.test.ts`
- **Add documentation:** `docs/DESIGN_TOKENS.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`feat(format): resolve locale instead of hard-coded en-US`

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
title: "Extract the next.config security headers into a shared testable module"
labels: type:refactor, area:security-headers, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Extract the next.config security headers into a shared testable module

### Description
`next.config.ts` inlines the `securityHeaders` array including a long single-string Content-Security-Policy, and `src/__tests__/nextConfigHeaders.test.ts` has to reach into the config to assert on it. Moving the definitions into `src/lib/securityHeaders.ts` with a composed directive map makes the policy readable and directly testable. It also lets a future middleware reuse the same source of truth.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Represent CSP as a `Record<string, string[]>` directive map plus a `serializeCsp()` function rather than a hand-written string.
- Have `next.config.ts` import from the new module so there is exactly one definition.
- Assert directive-level expectations (`frame-ancestors 'none'`, `base-uri 'self'`) instead of string equality.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/extract-security-headers-module`
- **Write code in:** `src/lib/securityHeaders.ts`
- **Write comprehensive tests in:** `src/__tests__/nextConfigHeaders.test.ts`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(security): extract security headers into shared module`

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
title: "Replace inline SVG markup with a shared Icon component and icon registry"
labels: type:refactor, area:ui-icons, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Replace inline SVG markup with a shared Icon component and icon registry

### Description
Inline `<svg>` blocks are duplicated across `src/components/IconButton.tsx`, `src/components/ThemeToggle.tsx`, `src/components/ConnectionBanner.tsx`, and the api-keys and webhooks clients, each repeating viewBox and stroke attributes. A single `Icon` component backed by a typed name registry removes the duplication and guarantees consistent sizing. It also centralises the `aria-hidden` and `focusable="false"` defaults that decorative icons need.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Define an `IconName` union so unknown names fail typecheck rather than rendering nothing.
- Default every icon to `aria-hidden="true"`; require an explicit `title` prop to opt into an accessible name.
- Migrate all existing inline SVG call sites in the same PR so no duplicate definitions remain.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/shared-icon-component`
- **Write code in:** `src/components/Icon.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Icon.test.tsx`
- **Add documentation:** `docs/STYLEGUIDE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(ui): introduce shared Icon component and registry`

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
title: "Model fetch state as a discriminated union in useApi and useList"
labels: type:refactor, area:data-hooks, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Model fetch state as a discriminated union in useApi and useList

### Description
`src/lib/useApi.ts` and `src/lib/useList.ts` return independent `data`, `loading`, and `error` fields, which lets callers render impossible combinations such as data present while an error is set. A `{ status: "idle" | "loading" | "success" | "error" }` union makes invalid states unrepresentable and lets TypeScript narrow `data` to non-null in the success branch. Consumers across the dashboard clients currently guard this by hand.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Export the union type and keep `refetch` on every variant so refresh buttons work in any state.
- Migrate consumers in `src/app/pairs/Client.tsx`, `src/app/events/Client.tsx`, and `src/app/webhooks/Client.tsx` in the same PR.
- Preserve the existing loading and error semantics so no user-visible behaviour changes.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b refactor/data-hooks-state-union`
- **Write code in:** `src/lib/useApi.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/useApi.test.ts`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`refactor(hooks): model fetch state as a discriminated union`

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
title: "Remove unsafe-eval and unsafe-inline from script-src with a nonce-based CSP"
labels: type:security, area:csp, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Remove unsafe-eval and unsafe-inline from script-src with a nonce-based CSP

### Description
The `Content-Security-Policy` in `next.config.ts` still allows `'unsafe-inline' 'unsafe-eval'` in `script-src`, which neutralises most of the XSS protection the header is meant to provide. Next.js supports nonce-based CSP via middleware that injects a per-request nonce. The inline theme bootstrap referenced from `public/theme-init.js` and `src/app/layout.tsx` is the main blocker and must carry the nonce.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `middleware.ts` that generates a per-request nonce and rewrites the CSP header for HTML responses only.
- Keep `'unsafe-eval'` out of production while allowing it in development, where the Next.js dev overlay requires it.
- Verify no console CSP violations across every route in `src/lib/routes.ts` after the change.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/nonce-based-csp`
- **Write code in:** `middleware.ts`
- **Write comprehensive tests in:** `src/__tests__/nextConfigHeaders.test.ts`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix(security): adopt nonce-based CSP and drop unsafe-eval`

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
title: "Tighten connect-src to the configured API origin instead of blanket https"
labels: type:security, area:csp, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Tighten connect-src to the configured API origin instead of blanket https

### Description
The CSP in `next.config.ts` sets `connect-src 'self' http://localhost:3001 https:`, which permits outbound requests to any HTTPS host and would not stop an injected script from exfiltrating data. Because `src/lib/config.ts` already resolves and validates a single API base, the policy can be narrowed to exactly that origin. The hard-coded localhost entry should also be derived rather than literal.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Derive the allowed origin from `NEXT_PUBLIC_STABLEROUTE_API_BASE` at config-evaluation time using the same validation as `validateApiBase`.
- Fail the build with a clear message when the env value is unparsable, rather than silently emitting a broken directive.
- Add regression coverage asserting `connect-src` contains no bare `https:` token.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/csp-connect-src-origin`
- **Write code in:** `next.config.ts`
- **Write comprehensive tests in:** `src/__tests__/nextConfigHeaders.test.ts`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix(security): scope connect-src to the configured API origin`

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
title: "Add an npm audit and license-compliance job to the CI workflow"
labels: type:security, area:supply-chain, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add an npm audit and license-compliance job to the CI workflow

### Description
`.github/workflows/ci.yml` builds and tests but never inspects the dependency tree recorded in `package-lock.json`, so a known-vulnerable transitive package can land unnoticed. A dedicated job running `npm audit` at a fixed severity threshold plus a license allowlist check closes that gap. Failing the job on high or critical findings keeps the signal actionable.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Run `npm audit --audit-level=high --omit=dev` and surface the JSON report as a workflow artifact.
- Add a license check that fails on copyleft licenses not present in a committed allowlist file.
- Schedule the job weekly with `on.schedule` in addition to running on pull requests.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b security/ci-audit-and-license-check`
- **Write code in:** `.github/workflows/ci.yml`
- **Write comprehensive tests in:** `scripts/__tests__/checkLicenses.test.ts`
- **Add documentation:** `SECURITY.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`ci(security): add npm audit and license compliance job`

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
title: "Add tests for the sanitizeErrorMessage redaction rules"
labels: type:test, area:api-client, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add tests for the sanitizeErrorMessage redaction rules

### Description
`sanitizeErrorMessage` in `src/lib/apiClient.ts` is the last line of defence against leaking secrets into toasts, yet its regex rules for query strings, 20+ character hex or Base58 runs, and prefixed key formats such as `sk_live_…` have no dedicated coverage. A regex change could silently stop redacting. Direct unit tests over the exported function pin the contract.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Cover each documented rule plus combinations: a message with both a query string and an embedded key.
- Assert false-positive safety — ordinary prose, short hex values, and Stellar asset codes must survive unredacted.
- Assert that `requestId` on the thrown error object is preserved and never inlined into the sanitised string.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/sanitize-error-message-rules`
- **Write code in:** `src/lib/apiClient.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/sanitizeErrorMessage.test.ts`
- **Add documentation:** `docs/api-client.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(api-client): cover sanitizeErrorMessage redaction rules`

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
title: "Add tests for parseEventsResponse payload truncation and cap behaviour"
labels: type:test, area:events, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add tests for parseEventsResponse payload truncation and cap behaviour

### Description
`src/lib/events.ts` documents several subtle branches: dropping malformed records, truncating at `MAX_PAYLOAD_PREVIEW_LENGTH`, populating `fullPayload` only past that threshold, replacing circular references with `[Circular]`, and setting `capped` at `MAX_RENDERED_EVENTS`. The existing `src/lib/events.test.ts` does not exercise these boundaries. Off-by-one behaviour at exactly the limits should be pinned.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Test payloads at exactly, one below, and one above `MAX_PAYLOAD_PREVIEW_LENGTH`, asserting `fullPayload` identity versus divergence.
- Cover a circular payload and a payload whose serialisation throws, asserting `[Circular]` and `[Unserializable payload]`.
- Verify `totalValid` counts valid records before capping and that `capped` flips only past `MAX_RENDERED_EVENTS`.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/events-truncation-and-cap`
- **Write code in:** `src/lib/events.ts`
- **Write comprehensive tests in:** `src/lib/__tests__/eventsBoundaries.test.ts`
- **Add documentation:** `docs/events-validation.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(events): cover payload truncation and render-cap boundaries`

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
title: "Add tests for the check-bundle-size script threshold evaluation"
labels: type:test, area:build-tooling, stack:nextjs, stack:react, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add tests for the check-bundle-size script threshold evaluation

### Description
`scripts/check-bundle-size.js` gates the build against the limits in `.bundle-budget.json`, but the script itself is untested and excluded from the Jest `testMatch` patterns in `jest.config.js`. A bug in its comparison logic would silently stop enforcing the budget. Splitting the pure evaluation from the filesystem read makes it testable.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Extract an `evaluateBudget(sizes, budget)` function returning per-entry pass/fail and an overall exit code.
- Cover under-budget, exactly-at-budget, over-budget, and missing-entry cases plus a malformed budget file.
- Extend the Jest `testMatch` or `roots` configuration so `scripts/` tests are picked up.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b test/check-bundle-size-thresholds`
- **Write code in:** `scripts/check-bundle-size.js`
- **Write comprehensive tests in:** `scripts/__tests__/checkBundleSize.test.js`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(build): cover bundle-size budget evaluation`

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
title: "Add jest-axe automated accessibility assertions to the component test suite"
labels: type:a11y, area:automated-a11y, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add jest-axe automated accessibility assertions to the component test suite

### Description
The suite under `src/components/__tests__/` asserts specific ARIA attributes by hand, which catches only the violations someone thought to write a test for. Adding `jest-axe` gives every rendered component a baseline scan for contrast, naming, and role misuse. Registering the matcher in `jest.setup.ts` makes it available across all suites.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `jest-axe` as a dev dependency and extend the matchers in `jest.setup.ts` alongside the existing `@testing-library/jest-dom` setup.
- Add `toHaveNoViolations` assertions to at least `Button`, `TextField`, `ConfirmDialog`, `CommandPalette`, and `ResourceList` tests.
- Document any rule that must be disabled and why, rather than silently suppressing failures.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/jest-axe-automated-assertions`
- **Write code in:** `jest.setup.ts`
- **Write comprehensive tests in:** `src/components/__tests__/AxeAudit.test.tsx`
- **Add documentation:** `CONTRIBUTING.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`test(a11y): add jest-axe assertions to component suite`

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
title: "Expose the header navigation as an ARIA navigation landmark with current-page state"
labels: type:a11y, area:header-nav, stack:nextjs, stack:react, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Expose the header navigation as an ARIA navigation landmark with current-page state

### Description
`src/components/Header.tsx` renders the primary route links but does not mark the active route for assistive technology, so screen-reader users cannot tell where they are. The links need `aria-current="page"` driven by the active pathname, and the nav landmark needs a distinguishing accessible name. `src/lib/routes.ts` already supplies the href each link should be compared against.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Set `aria-current="page"` on the link whose href matches the current pathname, matching exactly for `/` and by prefix for nested segments.
- Give the `<nav>` an `aria-label` such as "Primary" so it is distinguishable from any future secondary nav.
- Ensure the current-page style is conveyed by more than colour alone, per WCAG 1.4.1.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b a11y/header-nav-aria-current`
- **Write code in:** `src/components/Header.tsx`
- **Write comprehensive tests in:** `src/components/__tests__/Header.test.tsx`
- **Add documentation:** `docs/STYLEGUIDE.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`fix(a11y): mark the active header nav link with aria-current`

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
title: "Add a deployment guide covering hosting targets and runtime configuration"
labels: type:docs, area:deployment, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Add a deployment guide covering hosting targets and runtime configuration

### Description
`README.md` and `ARCHITECTURE.md` explain local development and internal structure, but nothing documents how to ship the app. Operators need to know that `NEXT_PUBLIC_STABLEROUTE_API_BASE` from `.env.example` is inlined at build time, so a rebuild is required to change API targets. The security headers in `next.config.ts` also behave differently behind a proxy that sets its own.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Cover managed hosting and self-hosted `next start` behind a reverse proxy, including the Node version used by the CI workflow.
- Explain the build-time nature of `NEXT_PUBLIC_*` values and how it interacts with the validation in `src/lib/config.ts`.
- Include a pre-deploy checklist referencing `npm run lint`, `npm test`, `npm run build`, and the bundle budget check.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b docs/deployment-guide`
- **Write code in:** `docs/DEPLOYMENT.md`
- **Write comprehensive tests in:** `src/__tests__/metadata.test.tsx`
- **Add documentation:** `README.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`docs: add deployment and runtime configuration guide`

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
title: "Back off the stats polling interval after repeated failures"
labels: type:performance, area:stats-polling, stack:nextjs, stack:react, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---
## Back off the stats polling interval after repeated failures

### Description
`src/app/stats/Client.tsx` polls the metrics endpoint on a fixed interval, so a downed API produces a steady stream of failing requests and repeated error toasts for as long as the tab stays open. Exponential backoff capped at a ceiling, reset on the first success, keeps the dashboard responsive without hammering a struggling backend. `apiFetch` in `src/lib/apiClient.ts` already exposes retry options that this should complement rather than duplicate.

### Requirements and context
- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Extract the scheduling into a testable `useBackoffInterval` hook with injectable timing so tests need no real delays.
- Cap the interval (for example at 60 seconds) and reset to the base interval on the first successful response.
- Suppress duplicate error toasts while in a backed-off failing state; surface a single persistent status instead.

### Suggested execution
- Fork the repo and create a branch
- `git checkout -b performance/stats-polling-backoff`
- **Write code in:** `src/app/stats/Client.tsx`
- **Write comprehensive tests in:** `src/app/stats/page.test.tsx`
- **Add documentation:** `docs/hooks.md`

### Test and commit
- Run `npm run lint`, `npm test`, `npm run build`
- Cover edge cases; include test output

### Example commit message
`perf(stats): back off polling interval after repeated failures`

### Guidelines
- Minimum 95 percent test coverage for impacted modules
- Clear documentation
- **Timeframe: 96 hours.**

### Community & contribution rewards
- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.

---
type: Feature
title: 'Add keyboard row navigation to the pairs list'
labels: type:a11y, area:pairs, stack:nextjs, stack:react, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Make the pairs list keyboard-operable

### Description

The pairs list is mouse-oriented; keyboard users cannot move between rows or activate a row without tabbing through every interactive child. This issue adds arrow-key row navigation with a roving tabindex.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Implement a roving-tabindex group over the pair rows so Up/Down move focus and Enter/Space activate the focused row.
- Preserve existing mouse behaviour and visible focus styling.
- Do not change the data or filtering logic.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/pairs-01-keyboard-nav`
- Implement changes
  - **Write code in:** the pairs list component.
  - **Write comprehensive tests in:** arrow keys move focus, Enter activates, tab enters/leaves the group once.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: first/last row wrap behaviour, empty list, single row.
- Include the full test output in the PR description.

### Example commit message

`a11y(pairs): add roving-tabindex keyboard navigation`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add tests for the pairs filter and search transform"
labels: type:test, area:pairs, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Cover the pairs filtering and grouping transform

### Description

The pure transform that filters and groups pairs by source underpins the pairs view but is thinly tested. This issue adds focused unit tests for it.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add unit tests for the filter-by-query and group-by-source helpers: case-insensitive match, no-match, whitespace query, and stable grouping order.
- Do not change the transform unless a test uncovers a real defect (note it if so).

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b test/pairs-01-transform`
- Implement changes
  - **Write comprehensive tests in:** the lib module that hosts the pairs transform.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty query, query matching source vs destination, duplicate pairs.
- Include the full test output in the PR description.

### Example commit message

`test(pairs): cover filter and group-by-source transform`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add a copy control to each pairs row for the pair symbol"
labels: type:feature, area:pairs, stack:nextjs, stack:react, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let operators copy a pair symbol in one click

### Description

Operators frequently need to copy a pair's symbol to paste elsewhere. This issue adds a small copy button per row with a toast confirmation and a non-secure-context fallback.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add an accessible copy control per pair row that copies the canonical pair symbol.
- Use the Clipboard API with a documented textarea fallback; confirm via the existing toast/notification system.
- Keep the control keyboard-operable with a clear accessible label.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-01-copy-symbol`
- Implement changes
  - **Write code in:** the pairs row component; reuse any existing clipboard helper.
  - **Write comprehensive tests in:** success path, clipboard-throws fallback, accessible name.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: clipboard unavailable, rapid repeated clicks.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add per-row copy pair symbol control`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Persist the selected stats time range across reloads"
labels: type:feature, area:stats, stack:nextjs, stack:react, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Remember the operator's stats time-range choice

### Description

The stats panel resets its time range on every reload. This issue persists the selected range so operators return to their preferred view.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Persist the selected range to a namespaced, SSR-guarded localStorage key and restore it on mount.
- Fall back safely to the current default when the stored value is missing or invalid.
- Do not change how the stats are fetched or rendered.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/stats-01-persist-range`
- Implement changes
  - **Write code in:** the stats panel component; add a tiny persisted-preference helper if none exists.
  - **Write comprehensive tests in:** restore on mount, invalid stored value falls back, change persists.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: corrupt stored value, SSR no-op, unknown range id.
- Include the full test output in the PR description.

### Example commit message

`feat(stats): persist selected time range`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Extract endpoint metadata into a typed registry consumed by the docs page"
labels: type:refactor, area:docs, stack:nextjs, stack:typescript, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Centralize the docs endpoint definitions

### Description

The docs page hard-codes endpoint sections inline, making them hard to reuse and easy to drift. This issue extracts the endpoint metadata into a typed registry the page maps over.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Move endpoint definitions (method, path, description, params) into a typed registry module.
- Render the docs page by mapping over the registry; output must be unchanged.
- No new dependencies; this is a structural refactor.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b refactor/docs-01-endpoint-registry`
- Implement changes
  - **Write code in:** create the registry module; update the docs page to consume it.
  - **Write comprehensive tests in:** assert the rendered docs sections match the registry entries.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty registry, an endpoint with no params.
- Include the full test output in the PR description.

### Example commit message

`refactor(docs): extract typed endpoint registry`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add a JSON and CSV export of the current pairs view"
labels: type:feature, area:pairs, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Export the current pairs view

### Description

Operators cannot export the pairs they are looking at. This issue adds a client-side export of the currently filtered pairs to JSON and CSV.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Export exactly the currently filtered/sorted pairs (not the full unfiltered set).
- Generate CSV safely (escape separators/quotes/newlines) and JSON; trigger a client-side download.
- Add an accessible control with a clear label; no server round-trip.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-02-export`
- Implement changes
  - **Write code in:** a small export helper plus a toolbar control.
  - **Write comprehensive tests in:** CSV escaping, JSON shape, respects the active filter.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty view, values containing commas/quotes/newlines.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add JSON/CSV export of the current view`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add an architecture overview of the frontend data flow"
labels: type:docs, area:docs, stack:nextjs, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Document how data flows through the frontend

### Description

New contributors lack a map of how the app fetches, transforms, and renders API data. This issue adds an architecture overview doc.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add `docs/architecture.md` covering the API client, the fetch-state model, the pairs/stats data flow, and where transforms live.
- Include a simple diagram (mermaid or ASCII) of request to render.
- Keep it accurate to the current code — read the modules first.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b docs/arch-01-data-flow`
- Implement changes
  - **Add documentation:** create `docs/architecture.md`.
- Test and commit

### Test and commit

- Run `npm run build`.
- Cover edge cases: n/a — verify each described module path exists.
- Include the full test output in the PR description.

### Example commit message

`docs(arch): add frontend data-flow overview`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Show a relative last-updated timestamp on the stats panel"
labels: type:feature, area:stats, stack:nextjs, stack:react, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Tell operators how fresh the stats are

### Description

The stats panel does not indicate when its data was last refreshed. This issue adds a live relative timestamp (for example, updated 12s ago) that ticks as time passes.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Record the last successful fetch time and render a relative label that updates on an interval.
- Clean up the interval on unmount; do not trigger extra fetches.
- Expose the absolute time via a title/tooltip for precision.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/stats-02-last-updated`
- Implement changes
  - **Write code in:** the stats panel; add a small relative-time helper if none exists.
  - **Write comprehensive tests in:** label reflects elapsed time (fake timers), interval cleared on unmount.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: just-now (0s), minutes/hours rollover, unmount mid-tick.
- Include the full test output in the PR description.

### Example commit message

`feat(stats): show relative last-updated timestamp`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Give the webhooks table a caption and scope-annotated headers"
labels: type:a11y, area:webhooks, stack:nextjs, stack:react, priority:medium, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Make the webhooks table screen-reader friendly

### Description

The webhooks table lacks a caption and scoped headers, so its structure is opaque to assistive tech. This issue adds a caption and proper header scopes.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a descriptive `<caption>` and `scope="col"`/`scope="row"` where appropriate to the webhooks table.
- Do not change the data or columns; structure/semantics only.
- Verify with an automated a11y assertion if the suite has one.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/webhooks-01-table-semantics`
- Implement changes
  - **Write code in:** the webhooks table component.
  - **Write comprehensive tests in:** caption present, column headers carry scope.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty table, a single-row table.
- Include the full test output in the PR description.

### Example commit message

`a11y(webhooks): add table caption and header scopes`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add tests for the stats polling backoff and recovery"
labels: type:test, area:stats, stack:typescript, priority:high, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Cover the stats polling backoff behaviour

### Description

The stats poller backs off after repeated failures and should recover on success, but this behaviour is under-tested. This issue adds focused tests.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add tests asserting: the interval grows after consecutive failures, is capped at the max, and resets after a success.
- Use fake timers; assert the scheduled delay progression rather than wall-clock.
- Do not change the poller unless a test uncovers a real defect (note it).

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b test/stats-01-backoff`
- Implement changes
  - **Write comprehensive tests in:** the stats polling module's test file.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: first failure, cap reached, success mid-backoff resets.
- Include the full test output in the PR description.

### Example commit message

`test(stats): cover polling backoff and recovery`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.
  ++++++

---

type: Feature
title: "Add a compact number formatter for large pair volumes"
labels: type:feature, area:format, stack:nextjs, stack:typescript, priority:low, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Format large volumes compactly (for example 1.2M)

### Description

Large volume numbers render in full, hurting scannability. This issue adds a compact formatter (K/M/B) used by the pairs and stats views, with an accessible full value.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a `formatCompactNumber` helper (locale-aware, using Intl compact notation) and apply it where large volumes render.
- Expose the precise value via a title/aria so no information is lost.
- Cover rounding at each magnitude boundary.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/format-01-compact-numbers`
- Implement changes
  - **Write code in:** `lib` format helpers; apply at the pair/stats render sites.
  - **Write comprehensive tests in:** boundaries at K/M/B, small numbers unchanged, negative values.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: 999 vs 1000, exact 1,000,000, negatives, zero.
- Include the full test output in the PR description.

### Example commit message

`feat(format): add compact large-number formatter`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.

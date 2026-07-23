---
type: Feature
title: 'Add a sparkline of recent values to the stats panel'
labels: type:feature, area:stats, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Visualize recent stats at a glance

### Description

The stats panel shows current numbers but no trend. This issue adds a small accessible sparkline of recent samples.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Render a compact sparkline from the recent stats samples with an accessible text summary of the trend.
- Do not add a charting dependency; a small inline SVG is sufficient.
- Handle sparse/empty data gracefully.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/stats-03-sparkline`
- Implement changes
  - **Write code in:** the stats panel component.
  - **Write comprehensive tests in:** renders points for samples, empty data no-op, text summary present.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: single sample, all-equal samples, empty.
- Include the full test output in the PR description.

### Example commit message

`feat(stats): add a recent-values sparkline`

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
title: "Add a caption and header scopes to the pairs table"
labels: type:a11y, area:pairs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Make the pairs table screen-reader friendly

### Description

The pairs table lacks a caption and scoped headers. This issue adds them for correct assistive-tech structure.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a descriptive caption and scope attributes to the pairs table headers.
- Data/columns unchanged; semantics only.
- Verify with an automated a11y assertion if available.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/pairs-02-table-semantics`
- Implement changes
  - **Write code in:** the pairs table component.
  - **Write comprehensive tests in:** caption present, column headers carry scope.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty table, single row.
- Include the full test output in the PR description.

### Example commit message

`a11y(pairs): add table caption and header scopes`

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
title: "Add a reset-to-defaults action to Settings"
labels: type:feature, area:settings, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let operators reset their preferences

### Description

Settings accumulate and there is no quick way to restore defaults. This issue adds a confirmed reset action.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add a reset control that restores all app settings to defaults behind a confirmation.
- Announce completion; do not touch unrelated stored data.
- Reuse the existing settings/storage layer.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/settings-01-reset-defaults`
- Implement changes
  - **Write code in:** the settings page.
  - **Write comprehensive tests in:** reset restores defaults, confirmation required, cancel is a no-op.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: already-default settings, cancel path.
- Include the full test output in the PR description.

### Example commit message

`feat(settings): add reset-to-defaults action`

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
title: "Add a per-pair detail drawer"
labels: type:feature, area:pairs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Show pair details without leaving the list

### Description

Inspecting a pair requires navigating away. This issue adds an accessible side drawer showing the selected pair's details in place.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Open an accessible drawer (focus-trapped, Escape to close) with the selected pair's details.
- Return focus to the triggering row on close.
- Reuse existing pair data; no new fetch if data is already present.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-03-detail-drawer`
- Implement changes
  - **Write code in:** the pairs list + a drawer component.
  - **Write comprehensive tests in:** opens with details, Escape closes, focus returns to trigger.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: rapid open/close, keyboard-only operation.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add a per-pair detail drawer`

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
title: "Announce stats refreshes through an aria-live region"
labels: type:a11y, area:stats, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Tell assistive tech when stats update

### Description

Stats refresh silently, so screen-reader users get no signal that data changed. This issue adds a polite announcement on refresh.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Announce a concise message via a polite live region when a stats refresh completes.
- Debounce so frequent polling does not spam the SR queue.
- No change to the polling logic.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/stats-01-refresh-live`
- Implement changes
  - **Write code in:** the stats panel.
  - **Write comprehensive tests in:** announcement on successful refresh, debounced under rapid updates.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: failed refresh (no announce), rapid successive refreshes.
- Include the full test output in the PR description.

### Example commit message

`a11y(stats): announce refreshes politely`

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
title: "Add a column visibility toggle to the pairs table"
labels: type:feature, area:pairs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let operators choose visible columns

### Description

The pairs table shows a fixed column set. This issue adds a persisted column visibility toggle.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add an accessible menu to show/hide columns; persist the choice to a namespaced, SSR-guarded key.
- Always keep at least one identifying column visible.
- Restore the saved choice on mount with a safe fallback.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-04-column-toggle`
- Implement changes
  - **Write code in:** the pairs table + a small persisted-preference helper.
  - **Write comprehensive tests in:** toggling hides/shows a column, persists, invalid stored value falls back.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: all-but-one hidden attempt, corrupt stored value.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add column visibility toggle`

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
title: "Add a global keyboard shortcut to toggle the theme"
labels: type:feature, area:theme, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Toggle light/dark from the keyboard

### Description

Switching theme requires opening settings/among controls. This issue adds a documented global shortcut.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Bind a documented shortcut to toggle the theme; ignore it while typing in inputs.
- Expose the shortcut in any help/shortcuts affordance.
- Reuse the existing theme mechanism.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/theme-01-toggle-shortcut`
- Implement changes
  - **Write code in:** a global key handler / theme provider.
  - **Write comprehensive tests in:** shortcut toggles theme, ignored while typing.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: focus in an input, repeated presses.
- Include the full test output in the PR description.

### Example commit message

`feat(theme): add a toggle-theme keyboard shortcut`

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
title: "Extract a shared number-formatting module for the pairs and stats views"
labels: type:refactor, area:format, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Centralize number formatting

### Description

Number formatting is repeated across the pairs and stats views. This issue extracts a single tested module they consume.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Create a `lib/format` number module (currency/percent/decimals) and adopt it at the pair/stats sites.
- Output unchanged for existing inputs; verified by tests.
- No new dependencies.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b refactor/format-01-number-module`
- Implement changes
  - **Write code in:** create `lib/format`; update call sites.
  - **Write comprehensive tests in:** table of inputs asserting unchanged output.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: zero, negatives, rounding boundaries.
- Include the full test output in the PR description.

### Example commit message

`refactor(format): centralize number formatting`

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
title: "Add a language selector to the code samples on the docs page"
labels: type:feature, area:docs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let readers switch code-sample language

### Description

Docs code samples are shown in a single language. This issue adds a selector (for example cURL, JavaScript) per endpoint.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add an accessible per-endpoint language selector switching the shown sample; default to the current language.
- Persist the choice for the session; keep copy-to-clipboard working per language.
- Reuse the endpoint metadata.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/docs-01-lang-selector`
- Implement changes
  - **Write code in:** the docs endpoint/code-sample components.
  - **Write comprehensive tests in:** selecting a language swaps the sample, copy still works.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: endpoint with one language only, unknown stored choice.
- Include the full test output in the PR description.

### Example commit message

`feat(docs): add code-sample language selector`

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
title: "Add an explicit no-results empty state to the filtered pairs list"
labels: type:feature, area:pairs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Guide users when filters match nothing

### Description

When a pairs filter matches nothing, the list renders blank with no guidance. This issue adds an accessible empty state.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Render a distinct, announced empty state when the active filter yields no pairs, with a clear-filter affordance.
- Keep it separate from the loading and error states.
- Reuse the existing filter state.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-05-empty-state`
- Implement changes
  - **Write code in:** the pairs list/results component.
  - **Write comprehensive tests in:** empty renders guidance + clear affordance, clear restores results.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: empty vs loading vs error exclusivity.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add no-results empty state`

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
title: "Group the Settings appearance controls with fieldset and legend"
labels: type:a11y, area:settings, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Give settings groups accessible structure

### Description

Related settings controls lack grouping semantics, making the form harder to navigate with assistive tech. This issue adds fieldset/legend grouping.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Wrap related settings controls in fieldset/legend with meaningful legends.
- No change to the control behaviour or layout intent.
- Verify with an automated a11y assertion if available.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/settings-01-fieldset`
- Implement changes
  - **Write code in:** the settings page.
  - **Write comprehensive tests in:** groups expose an accessible name via legend.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: single-control group, nested groups.
- Include the full test output in the PR description.

### Example commit message

`a11y(settings): group controls with fieldset/legend`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.

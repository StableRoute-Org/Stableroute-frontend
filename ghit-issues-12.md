---
type: Feature
title: 'Add a manual refresh button to the pairs list'
labels: type:feature, area:pairs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let operators refetch pairs on demand

### Description

The pairs list refreshes on its own schedule with no manual trigger. This issue adds an accessible refresh button that refetches immediately.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add an accessible refresh control that refetches the pairs and reflects a busy state while loading.
- Debounce to prevent rapid duplicate fetches; announce completion.
- Reuse the existing fetch path.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/pairs-06-manual-refresh`
- Implement changes
  - **Write code in:** the pairs list toolbar.
  - **Write comprehensive tests in:** click refetches, busy state shown, rapid clicks coalesce.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: refetch during an in-flight load, error refetch.
- Include the full test output in the PR description.

### Example commit message

`feat(pairs): add manual refresh button`

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
title: "Add heading structure to the docs page sections"
labels: type:a11y, area:docs, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Give the docs page a proper heading outline

### Description

The docs page sections lack a consistent heading hierarchy, hurting navigation for assistive tech. This issue adds a correct outline.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Ensure each docs section uses correctly-ranked headings forming a valid outline (no skipped levels).
- No visual redesign; semantics only.
- Verify with an automated a11y assertion if available.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b a11y/docs-01-headings`
- Implement changes
  - **Write code in:** the docs page/section components.
  - **Write comprehensive tests in:** heading levels form a valid, non-skipping outline.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: single-section page, deeply nested section.
- Include the full test output in the PR description.

### Example commit message

`a11y(docs): add proper heading structure`

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
title: "Add tests for the pairs detail drawer open and close"
labels: type:test, area:pairs, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Cover the pairs detail drawer

### Description

The pairs detail drawer (where present) needs tests for open, focus trap, Escape close, and focus return. This issue adds them.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add tests asserting the drawer opens with details, traps focus, closes on Escape, and returns focus to the trigger.
- Drive via the rendered component.
- Do not change behaviour unless a defect is found (note it).

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b test/pairs-02-drawer`
- Implement changes
  - **Write comprehensive tests in:** the pairs drawer test file.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: rapid open/close, keyboard-only.
- Include the full test output in the PR description.

### Example commit message

`test(pairs): cover detail drawer open/close`

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
title: "Add a copy-stats-snapshot action"
labels: type:feature, area:stats, stack:nextjs, stack:react, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Let operators copy a stats snapshot

### Description

Operators cannot quickly copy the current stats for sharing. This issue adds a control that copies a concise text snapshot of the current stats.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Add an accessible control copying a concise text summary of the current stats to the clipboard.
- Use the Clipboard API with a documented fallback; confirm via a toast/notification.
- Reflect the currently displayed values.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/stats-04-copy-snapshot`
- Implement changes
  - **Write code in:** the stats panel; reuse any clipboard helper.
  - **Write comprehensive tests in:** snapshot text reflects values, fallback path, accessible name.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: clipboard unavailable, empty stats.
- Include the full test output in the PR description.

### Example commit message

`feat(stats): add copy stats snapshot`

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
title: "Pass a request-id header through the API client for tracing"
labels: type:feature, area:api, stack:typescript, MAYBE REWARDED, GRANTFOX OSS, OFFICIAL CAMPAIGN, Official Campaign | FWC26
assignees: ''
---

## Correlate frontend requests with backend logs

### Description

Frontend requests do not carry a correlation id, making it hard to trace them in backend logs. This issue adds a per-request id header.

### Requirements and context

- **Repository scope:** StableRoute-Org/Stableroute-frontend only.
- Generate a per-request id and send it as a header on API calls; surface it in error states for support.
- Do not change response handling.
- Keep it collision-resistant without adding dependencies.

### Suggested execution

- Fork the repo and create a branch
- `git checkout -b feature/api-01-request-id`
- Implement changes
  - **Write code in:** the API client.
  - **Write comprehensive tests in:** header present per request, id surfaced on error.
- Test and commit

### Test and commit

- Run `npm run lint`, `npm test`, and `npm run build`.
- Cover edge cases: concurrent requests get distinct ids.
- Include the full test output in the PR description.

### Example commit message

`feat(api): pass a request-id header for tracing`

### Guidelines

- **Minimum 95 percent test coverage** for impacted modules.
- Clear, reviewer-focused documentation.
- **Timeframe: 96 hours.**

### Community & contribution rewards

- 💬 **Join the StableRoute community on Discord:** https://discord.gg/37aCpusvx
- ⭐ This is a **GrantFox OSS / Official Campaign** task and **may be rewarded**. When your PR is merged you'll be prompted to rate the project — a **5-star rating** is much appreciated.

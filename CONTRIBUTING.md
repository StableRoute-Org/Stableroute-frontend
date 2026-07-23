# Contributing to StableRoute Frontend

## Getting started

1. Fork the repository and create a branch named after the issue
   (e.g. `feat/quote-89-swap-direction`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Before opening a PR, make sure all three local checks pass:
   ```bash
   npm run lint   # ESLint — must exit 0
   npm test       # Jest unit tests
   npm run build  # Next.js production build
   ```
4. Reference the GrantFox issue with `Fixes #<number>` in the commit/PR description.
5. Include your Stellar public key in the issue comment for GrantFox escrow payout.

See `ARCHITECTURE.md` for module layout and `README.md` for local setup via `.env.example`.

---

## Required CI checks

Every pull request targeting `main` must pass **all three** of the following GitHub Actions
jobs before it can be merged:

| Job               | Command                                    | What it enforces                                                             |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| **Lint**          | `npm run lint`                             | Zero ESLint errors (warnings do not block merge, errors do)                  |
| **Build & Test**  | `npm run build` then `npm test`            | Successful Next.js production build and all Jest tests green                 |
| **Lighthouse CI** | `lhci autorun --config=.lighthouserc.json` | Runtime performance budgets on `/`, `/pairs`, `/events`, `/docs` (see below) |

Lint and Build & Test run in **parallel**. The Lighthouse CI job runs after Build & Test
succeeds (`needs: build-test`), so it never blocks the faster checks. All three must be
green — passing two out of three is not sufficient to merge.

### Lint configuration

Linting is performed by `next lint` (ESLint via `eslint-config-next`).
The workflow is configured with the default Next.js strict mode, which treats
ESLint **errors** as workflow failures. Warnings are reported but do not fail the job.

To replicate CI lint behaviour locally:

```bash
npm run lint
```

If you see errors, fix them before pushing. Common issues:

- Unused imports or variables (`no-unused-vars`)
- Multiple import declarations from the same module (`no-duplicate-imports`)
- Missing `key` props in lists (`react/jsx-key`)
- `<img>` instead of Next.js `<Image>` (`@next/next/no-img-element`)

### Test coverage

New code should maintain a minimum of **95% coverage** for impacted modules.
This includes build scripts in the `scripts/` directory.
Run coverage locally with:

```bash
npm run test:coverage
```

---

## Lighthouse CI — performance budgets

Lighthouse CI audits four routes on every PR to catch runtime regressions before they
reach `main`. The budgets are declared in `.lighthouserc.json` at the repo root.

### Audited routes

| Route     | Purpose             |
| --------- | ------------------- |
| `/`       | Home / landing page |
| `/pairs`  | Currency pair list  |
| `/events` | Audit log           |
| `/docs`   | API documentation   |

### Performance thresholds

Assertions that cause a **job failure** (error severity):

| Metric / Category        | Budget     |
| ------------------------ | ---------- |
| Performance score        | ≥ 0.80     |
| Accessibility score      | ≥ 0.90     |
| Best Practices score     | ≥ 0.80     |
| SEO score                | ≥ 0.80     |
| Largest Contentful Paint | ≤ 2 500 ms |
| Cumulative Layout Shift  | ≤ 0.10     |

Assertions that emit a **warning** (advisory only, do not fail the job):

| Metric                 | Advisory budget |
| ---------------------- | --------------- |
| First Contentful Paint | ≤ 2 000 ms      |
| Total Blocking Time    | ≤ 300 ms        |
| Time to Interactive    | ≤ 3 800 ms      |
| Speed Index            | ≤ 3 400 ms      |

### Running Lighthouse CI locally

You need the production bundle to be built before running audits.

```bash
# 1. Build the production bundle
npm run build

# 2. Install the CLI tool (one-off; not saved to package.json)
npm install --no-save @lhci/cli@0.14.0

# 3. Run the audit — starts the server automatically, runs audits, stops server
npx lhci autorun --config=.lighthouserc.json
```

The server starts on port 3000, audits each of the four routes, then shuts down.
HTML reports are written to `.lighthouseci/` in the repo root.

> The `.lighthouseci/` directory is listed in `.gitignore`. Reports are only persisted
> to GitHub as workflow artifacts — they are not committed to the repo.

### Viewing HTML reports

**In CI:** After the Lighthouse CI job runs (even if it fails), open the GitHub Actions
run, scroll to the **Artifacts** section, and download `lighthouse-reports-<run-id>`.
Extract the archive and open any `.html` file in a browser for the full interactive report.

**Locally:** After `lhci autorun`, open any file from `.lighthouseci/`:

```bash
# Example (Linux/macOS)
xdg-open .lighthouseci/*.report.html   # Linux
open .lighthouseci/*.report.html        # macOS
```

### Adjusting thresholds

All thresholds live in `.lighthouserc.json`. If a legitimate feature causes a score to
drop below budget, update the relevant assertion rather than suppressing the check.
Include a comment in the PR explaining the trade-off.

To tighten a threshold (recommended after an improvement lands):

```jsonc
// .lighthouserc.json — example: tightening LCP to 2 000 ms
"largest-contentful-paint": ["error", { "maxNumericValue": 2000 }]
```

To convert a warning-only metric to a hard failure:

```jsonc
// Change "warn" to "error" for the metric you want to enforce
"first-contentful-paint": ["error", { "maxNumericValue": 1800 }]
```

### The `lighthouseConfig.test.js` test suite

`scripts/__tests__/lighthouseConfig.test.js` verifies the shape and values of
`.lighthouserc.json` without needing a browser or a running server. It runs as part
of the normal Jest suite (`npm test`) and covers:

- Schema validation (required top-level sections, correct field types)
- All four required routes are present and target `localhost:3000`
- Server start command matches `npm start` and ready pattern matches Next.js output
- Desktop preset is configured (not mobile)
- All error-severity assertions are present and have budgets at or below the required
  thresholds
- All advisory assertions are defined with either `warn` or `error` severity
- Assertion tuple format `[severity, options]` is valid for every entry
- Upload target is `filesystem` pointing at `.lighthouseci`

---

## Branch naming

| Type        | Pattern               | Example                           |
| ----------- | --------------------- | --------------------------------- |
| Feature     | `feat/<issue>-<slug>` | `feat/89-swap-direction`          |
| Bug fix     | `fix/<issue>-<slug>`  | `fix/102-header-overflow`         |
| Chore / CI  | `chore/<slug>`        | `chore/ci-lint-job`               |
| Enhancement | `enhancement/<slug>`  | `enhancement/ci-run-npm-run-lint` |

---

## Commit message format

```
<type>(scope): short description (#issue)

- bullet explaining what changed
- bullet explaining why
```

Example:

```
chore(ci): add a lint job to the CI workflow (#336)

- Promotes npm run lint to a required parallel CI job
- Fails the workflow on ESLint errors, not warnings
- Documents required checks in CONTRIBUTING.md
```

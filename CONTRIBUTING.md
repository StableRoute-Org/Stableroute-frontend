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

Every pull request targeting `main` must pass **both** of the following GitHub Actions jobs
before it can be merged:

| Job | Command | What it enforces |
|-----|---------|-----------------|
| **Lint** | `npm run lint` | Zero ESLint errors (warnings do not block merge, errors do) |
| **Build & Test** | `npm run build` then `npm test` | Successful Next.js production build and all Jest tests green |

The jobs run in **parallel** to keep CI fast. Both must be green — a green Build & Test
alone is not sufficient to merge if Lint is red.

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

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<issue>-<slug>` | `feat/89-swap-direction` |
| Bug fix | `fix/<issue>-<slug>` | `fix/102-header-overflow` |
| Chore / CI | `chore/<slug>` | `chore/ci-lint-job` |
| Enhancement | `enhancement/<slug>` | `enhancement/ci-run-npm-run-lint` |

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

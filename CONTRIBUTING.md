# Contributing to StableRoute Frontend

Thank you for contributing to the StableRoute frontend! This guide explains the
development workflow, the automated checks that gate every pull request, and how
to reproduce those checks locally before you push.

---

## Table of Contents

1. [Getting started](#1-getting-started)
2. [Branch naming](#2-branch-naming)
3. [CI workflow overview](#3-ci-workflow-overview)
4. [CI jobs and commands](#4-ci-jobs-and-commands)
5. [Reproducing every check locally](#5-reproducing-every-check-locally)
6. [When a check fails on a fork](#6-when-a-check-fails-on-a-fork)
7. [Pull request checklist](#7-pull-request-checklist)
8. [GrantFox payout](#8-grantfox-payout)

---

## 1. Getting started

```bash
# Clone your fork and enter the directory
git clone https://github.com/<your-username>/Stableroute-frontend.git
cd Stableroute-frontend

# Install exact dependency versions recorded in the lock file
npm ci
```

> **Node version:** The CI pipeline runs on **Node 20**. Use the same version
> locally to avoid version-specific build or test failures. [nvm](https://github.com/nvm-sh/nvm)
> users: `nvm use 20`.

---

## 2. Branch naming

Create a branch from `main` named after the issue you are addressing:

```
feat/<short-description>-<issue-number>   # new feature
fix/<short-description>-<issue-number>    # bug fix
docs/<short-description>                  # documentation only
chore/<short-description>                 # tooling / maintenance
```

Examples:

```bash
git checkout -b feat/quote-swap-direction-89
git checkout -b docs/document-ci-workflow
git checkout -b fix/webhook-delete-404-102
```

---

## 3. CI workflow overview

The workflow is defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

| Trigger | Branches |
|---------|----------|
| `push` | `main` |
| `pull_request` | `main` (targets `main`) |

Every push to `main` and every PR targeting `main` runs the `build-test` job.
**All checks must be green before a PR can be merged.**

### Environment

| Setting | Value |
|---------|-------|
| Runner OS | `ubuntu-latest` |
| Node.js version | `20` |
| Dependency install | `npm ci` (lock-file exact install) |
| npm cache | enabled (`cache: "npm"`) |

---

## 4. CI jobs and commands

There is currently one job: **`build-test`**. It runs these steps in order:

| Step | Action / Command | Purpose |
|------|-----------------|---------|
| **Checkout** | `actions/checkout@v4` | Fetches the repository at the PR's commit SHA |
| **Setup Node.js** | `actions/setup-node@v4` (Node 20, npm cache) | Installs Node and restores the npm cache |
| **Install dependencies** | `npm ci` | Clean install from `package-lock.json` — fails if the lock file is out of sync |
| **Lint** | `npm run lint` | Runs `next lint` (ESLint); fails if any ESLint errors are reported |
| **Build** | `npm run build` | Runs `next build`; catches TypeScript errors and broken imports |
| **Run tests** | `npm test` | Runs the full Jest suite; fails if any test fails or the suite exits non-zero |

All six steps must pass for the `build-test` job to be green. A PR cannot be
merged until the job succeeds.

---

## 5. Reproducing every check locally

Run these commands in the same order as CI before opening a PR.

### 5.1 Install dependencies (mirrors `npm ci` in CI)

```bash
npm ci
```

This does a clean, lock-file-exact install identical to what CI performs. If
`package-lock.json` is out of sync with `package.json` this command exits with
an error — fix it by running `npm install` and committing the updated lock file.

### 5.2 Build (mirrors `npm run build` in CI)

```bash
npm run build
```

Runs `next build`. This step:

- Type-checks all TypeScript source files.
- Verifies that every import resolves.
- Generates the production bundle and static pages.

A passing build output looks like:

```
✓ Compiled successfully
✓ Linting and checking validity of types
Route (app)                              Size     First Load JS
┌ ○ /                                   ...
...
```

Any TypeScript error or unresolved import will cause this step to fail.

### 5.3 Tests (mirrors `npm test` in CI)

```bash
npm test
```

Runs the full Jest suite (jsdom environment). All files matching
`**/*.test.ts` / `**/*.test.tsx` under `src/` are included.

Useful variants:

```bash
# Watch mode — re-runs tests on file save
npm run test:watch

# Run a single file
npx jest src/app/quote/page.test.tsx --runInBand

# Coverage report (text summary)
npm run test:coverage
```

A passing run looks like:

```
PASS  src/components/Button.test.tsx
PASS  src/app/quote/page.test.tsx
...
Test Suites: N passed, N total
Tests:       N passed, N total
```

### 5.4 Lint (mirrors `npm run lint` in CI)

```bash
npm run lint
```

Runs `next lint` (ESLint with the Next.js ruleset). This step runs in CI and
**must pass** for the `build-test` job to succeed. Fix all reported errors
before pushing; warnings are acceptable but errors will fail the CI job.

### 5.5 Full pre-push sequence

```bash
npm ci             # clean install
npm run lint       # ESLint (mirrors CI order)
npm run build      # TypeScript + bundle check
npm test           # full test suite
```

If all four commands exit with code `0`, your branch is ready to push.

---

## 6. When a check fails on a fork

### 6.1 "Action required" — GitHub Actions not approved for your fork

Fork PRs from first-time contributors require a maintainer to approve the
GitHub Actions run before CI starts. This is a GitHub security feature and
**not a code problem**.

**What to do:**

1. Open the PR; GitHub will show a yellow banner: *"Waiting for approval from a
   maintainer to run GitHub Actions"*.
2. Leave a comment asking a maintainer to approve the first run (e.g.
   *"Please approve CI for this PR"*).
3. Once approved, CI will start automatically for subsequent pushes on the same
   PR.

### 6.2 Lint step fails

The `npm run lint` step failing means ESLint found errors in the codebase:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Error: …` rule violation | ESLint rule broken | Run `npm run lint` locally, read the error, and fix the offending line |
| `Parsing error: …` | Syntax error or unsupported syntax | Fix the syntax; ensure your TypeScript is valid |

Run `npm run lint` locally until it exits `0` before pushing.

### 6.3 Build step fails

The `npm run build` step failing usually means:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `Type error: …` | TypeScript type mismatch | Fix the type error locally: `npm run build` |
| `Module not found: …` | Missing or wrong import path | Check the import path and file casing |
| `Lock file is out of date` | `package-lock.json` not committed after `npm install` | Run `npm install` locally and commit the updated lock file |

### 6.4 Test step fails

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `● Test suite failed to run` | Syntax/import error in a test file | Run the failing file with `npx jest <path> --runInBand` locally |
| `expect(…).toBe(…)` assertion failed | Logic regression | Read the test output, fix the component/function, re-run |
| Tests time out | Unresolved async / missing mock | Ensure `fetch` or async calls are properly mocked |

### 6.5 Re-running CI after a fix

Push a new commit to your branch — CI re-runs automatically. You do not need to
close and reopen the PR.

```bash
git add <changed-files>
git commit -m "fix: resolve build type error in pairs page"
git push
```

### 6.6 Investigating CI logs

1. Open the PR on GitHub.
2. Click the **Checks** tab or the red ✗ next to the commit SHA.
3. Click **build-test** → expand the failing step to read the full log.

The log output is identical to what you see when running the same command
locally, so a failure you can reproduce locally is a failure you can fix.

---

## 7. Pull request checklist

Before requesting a review, confirm all of the following:

- [ ] Branch is based on the latest `main` (`git fetch origin && git rebase origin/main`)
- [ ] `npm ci` completes without errors
- [ ] `npm run build` exits `0` (no TypeScript or build errors)
- [ ] `npm test` exits `0` (all tests pass)
- [ ] `npm run lint` exits `0` (no ESLint errors)
- [ ] New behaviour is covered by tests; existing tests are not deleted
- [ ] PR title is concise (≤ 70 characters)
- [ ] PR description references the issue with `Fixes #<issue-number>`
- [ ] No secrets, `.env` files, or credentials are committed

---

## 8. GrantFox payout

If this is a GrantFox campaign task:

1. Include `Fixes #<issue-number>` in the PR description.
2. Leave your **Stellar public key** in a comment on the GitHub issue for escrow
   payout processing.

See `README.md` for full local setup instructions and `ARCHITECTURE.md` for
module layout.

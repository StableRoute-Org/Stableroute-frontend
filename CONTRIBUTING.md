# Contributing to stableroute-frontend

Thanks for helping improve the StableRoute frontend. This guide mirrors the local checks and test style used by the repository so pull requests are easier to review and merge.

## Workflow

1. Fork the repository.
2. Create a focused branch from `main`.
3. Keep each pull request scoped to one issue or one clearly related change.
4. Run the relevant checks locally before opening the pull request.

Use a branch name in this shape:

```text
type/area-short-description
```

Examples:

```text
feature/header-mobile-menu
test/components-button-card
docs/contributing-guide
fix/api-key-revoke-dialog
security/webhook-url-validation
```

Prefer short branches that describe the change, not the implementation detail.

## Local Setup

Install dependencies with the lockfile-backed command used by CI:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

## Project Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js development server. |
| `npm run build` | Build the production Next.js app. |
| `npm run start` | Serve the production build locally. |
| `npm run lint` | Run the Next.js ESLint checks. |
| `npm test` | Run the Jest test suite. |
| `npm run test:watch` | Run Jest in watch mode while developing. |

Before opening a pull request, run the checks that match the changed area. For most code changes, use:

```bash
npm run lint
npm test
npm run build
```

## Testing Conventions

Component tests live next to the component area in `src/**/__tests__`. Existing examples include:

- `src/components/__tests__/Badge.test.tsx`
- `src/components/__tests__/Card.test.tsx`
- `src/components/__tests__/Header.test.tsx`
- `src/components/__tests__/Spinner.test.tsx`

Follow these conventions:

- Use Jest with Testing Library for user-facing component behavior.
- Use `@testing-library/jest-dom` matchers from `jest.setup.ts`.
- Prefer assertions on visible text, roles, labels, and accessible state.
- Mock browser APIs, `fetch`, and `next/navigation` only at the test boundary.
- Keep fixtures fake, deterministic, and safe for public review.
- Add tests for loading, empty, error, and success states when the component has those states.

When adding UI behavior, cover keyboard operation and accessibility attributes such as `aria-label`, `aria-current`, `aria-expanded`, and `role` where relevant.

## Documentation Updates

Update documentation when a change affects setup, routes, environment variables, scripts, or contributor expectations. Keep examples aligned with the actual `package.json` scripts and repository paths.

## Pull Request Checklist

Before submitting, confirm:

- [ ] The branch name follows `type/area-short-description`.
- [ ] The pull request addresses one issue or one focused change.
- [ ] Tests were added or updated for new behavior.
- [ ] `npm run lint` passes, or the PR explains a pre-existing blocker.
- [ ] `npm test` passes, or the PR explains a pre-existing blocker.
- [ ] `npm run build` passes, or the PR explains a pre-existing blocker.
- [ ] Documentation was updated when the change affects contributor or user workflows.
- [ ] Accessibility was considered for interactive UI.
- [ ] No secrets, private keys, production data, or real customer data were added.

## Review Notes

Make the PR description easy to scan:

- Link the related issue.
- Summarize the user-visible change.
- List the exact commands run locally.
- Call out any known limitation or pre-existing failure separately from the new change.

Small, tested pull requests are the fastest path to review.

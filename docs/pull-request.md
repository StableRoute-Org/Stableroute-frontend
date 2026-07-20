# Pull Request Guidelines

This repository uses GitHub pull requests to review and merge changes. Follow these guidelines to make PRs easy to review and keep the repository healthy.

## Branch naming

Use a descriptive branch name that reflects the scope of the change:

- `feat/<feature-name>` for new features
- `fix/<issue-description>` for bug fixes
- `chore/<maintenance-task>` for repository housekeeping
- `docs/<documentation-update>` for docs-only changes

Examples:

- `feat/quote-form-validation`
- `fix/pairs-duplicate-normalization`
- `docs/add-security-policy`

## PR title

Use a concise title describing the change, and include the issue number when relevant:

- `Add new pair validation for Stellar asset codes`
- `Fix API key list refresh after revocation`
- `Update README with security disclosure guidance`

## PR description

Include the following sections in the PR description:

- **Summary**: What changed and why.
- **Test plan**: How the change was verified.
- **Related issues**: Issue numbers, e.g. `Fixes #123`.
- **Notes**: Any special details reviewers should know.

## Checklist

Before requesting review, ensure the PR includes:

- [ ] A clear summary of the change
- [ ] Relevant issue references or links
- [ ] Tests added or updated as needed
- [ ] `npm test` passes locally
- [ ] `npm run lint` passes locally
- [ ] No formatting or lint issues remain
- [ ] Documentation updated if behavior or developer workflow changed

## Testing

Run the repository’s standard local checks:

```bash
npm test
npm run lint
```

For changes that affect type safety or build output, also run:

```bash
npm run build
```

If applicable, include the command used to run any targeted tests.

## Review expectations

- Keep PRs focused and small when possible.
- Separate documentation-only changes from code changes.
- Mention if the PR includes a security-sensitive fix or disclosure coordination.
- If a PR depends on another branch or draft work, note that clearly.

## Merging

This repository expects CI to pass before merging. Ensure the pull request has a green build and review approval from a maintainer.

## Community

If you are contributing through a fork, make sure GitHub Actions are approved for the fork PR or ask a maintainer to approve them.

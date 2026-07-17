# Contributing to StableRoute frontend

1. Fork the repository and create a branch named after the issue (e.g. `feat/quote-89-swap-direction`).
2. Run `npm install`, `npm test`, and `npm run lint` before opening a PR.
3. Reference the GrantFox issue with `Fixes #123` in the commit/PR description.
4. Include your Stellar public key only in the GrantFox issue or claim flow when a maintainer or GrantFox explicitly requests it.

See `ARCHITECTURE.md` for module layout and `README.md` for local setup via `.env.example`.

## GitHub templates

Use the issue templates under `.github/ISSUE_TEMPLATE/` so maintainers get consistent reproduction steps, requested behaviour, and GrantFox context:

- `bug_report.md` for reproducible frontend defects.
- `feature_request.md` for user-facing improvements or new behaviours.
- `grantfox.md` for campaign pickup notes or contributor questions.

Pull requests should use `.github/PULL_REQUEST_TEMPLATE.md`. The checklist keeps reviews focused on linked issues, validation commands, documentation, and accessibility.

## Accessibility and review checklist

For UI changes, include keyboard, screen-reader, colour contrast, responsive layout, and reduced-motion considerations in the PR notes. When a change is documentation-only or template-only, say so explicitly and include a rendered preview note instead of screenshots.

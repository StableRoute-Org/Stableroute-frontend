# Contributing to StableRoute frontend

1. Fork the repository and create a branch named after the issue (e.g. `feat/quote-89-swap-direction`).
2. Run `npm install`, `npm test`, and `npm run lint` before opening a PR.
3. Reference the GrantFox issue with `Fixes #123` in the commit/PR description.
4. Include your Stellar public key in the issue comment for GrantFox escrow payout.

See `ARCHITECTURE.md` for module layout and `README.md` for local setup via `.env.example`.

## Changelog

This project keeps `CHANGELOG.md` in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
format. Every user-facing change should get an entry under `[Unreleased]` in the
same PR that makes the change, filed under the section that matches its
conventional-commit type:

| Commit type | Changelog section |
|-------------|--------------------|
| `feat`      | Added              |
| `fix`       | Fixed              |
| `perf`      | Changed            |
| `refactor`  | Changed            |
| `docs`      | Changed            |
| `deprecate` | Deprecated         |
| `remove`    | Removed            |
| `security`  | Security           |

Commits that don't change behavior for consumers of this app (`chore`,
`ci`, `test`, `style`) don't need a changelog entry.

When a release is cut, the `[Unreleased]` section is renamed to the new
version and date, and a fresh empty `[Unreleased]` section is added above it.

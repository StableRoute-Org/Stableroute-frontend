# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows the conventional-commit mapping described in
[CONTRIBUTING.md](CONTRIBUTING.md).

## [Unreleased]

Nothing yet.

## [0.1.0] - 2026-03-15

### Added

- Next.js 15 (App Router) frontend with React and TailwindCSS.
- Routes: `/`, `/pairs`, `/pairs/new`, `/quote`, `/stats`, `/admin`,
  `/api-keys`, `/events`, `/webhooks`, `/settings`, `/docs`, `/about`.
- Shared UI components: `TextField`, `Button`, `IconButton`, `PageHeading`,
  `ConfirmDialog`, `EmptyState`, `StatTile`, `TimeAgo`, `Badge`,
  `ThemeToggle`, `ToastProvider`, `KeyboardShortcutsHelp`, `CommandPalette`.
- Data fetching helpers (`apiClient`, `useApi`, `useList`) for the
  StableRoute API backend.
- Shared footer with dynamic copyright year and links to `/docs`, `/about`,
  and the StableRoute Discord community.
- Jest test suite and build/lint scripts (`npm test`, `npm run build`,
  `npm run lint`).

[Unreleased]: https://github.com/StableRoute-Org/Stableroute-frontend/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/StableRoute-Org/Stableroute-frontend/releases/tag/v0.1.0

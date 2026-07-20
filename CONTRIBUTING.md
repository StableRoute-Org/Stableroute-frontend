# Contributing to StableRoute frontend

1. Fork the repository and create a branch named after the issue (e.g. `feat/quote-89-swap-direction`).
2. Run `npm install`, `npm test`, and `npm run lint` before opening a PR.
3. Reference the GrantFox issue with `Fixes #123` in the commit/PR description.
4. Include your Stellar public key in the issue comment for GrantFox escrow payout.

## Code Style & Formatting

We use Prettier to maintain a consistent code style across the project. Please ensure your code is properly formatted before submitting a Pull Request.

- **Check formatting:** `npm run format:check`
- **Apply formatting:** `npm run format`

See `ARCHITECTURE.md` for module layout and `README.md` for local setup via `.env.example`.

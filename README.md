# stableroute-frontend

Next.js app for [StableRoute](https://github.com/your-org/stableroute) — Stellar liquidity routing (wallet / payment UI).

## What this repo contains

- **Next.js 15** (App Router) with **React 19**
- **TailwindCSS** for styling
- Starter landing page; Stellar wallet integration can be added here
- Shared API helpers include a default request timeout with optional per-call overrides

## Prerequisites

- Node.js 18+
- npm

## Setup (contributors)

1. Clone the repo and enter the directory:
   ```bash
   git clone <repo-url> && cd stableroute-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build and test:
   ```bash
   npm run build
   npm test
   ```
4. Run locally:
   ```bash
   npm run dev
   ```
   App: `http://localhost:3000`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Next.js) |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm test` | Run Jest tests |
| `npm run lint` | Next.js ESLint |

## CI/CD

On every push/PR to `main`, GitHub Actions runs:

- `npm ci`
- `npm run build`
- `npm test`

Ensure these pass locally before pushing.

## Contributing

1. Fork the repo and create a branch from `main`.
2. Add tests for new UI/behavior; keep `npm run build` and `npm test` passing.
3. Open a PR; CI must be green.

## License

MIT

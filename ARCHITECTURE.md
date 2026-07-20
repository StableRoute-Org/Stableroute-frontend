# Architecture

## App Router layout

- `src/app/layout.tsx` — global shell: skip link, toast provider, header/footer.
- `src/app/*/Client.tsx` — interactive dashboard pages.
- `src/lib/apiClient.ts` — shared fetch wrapper with auth-error hook and optional retry/timeout.
- `src/lib/config.ts` — API base resolution and validation.
- `src/lib/useApi.ts` / `src/lib/useList.ts` — client data-loading helpers.

## Data flow

Dashboard pages call the StableRoute HTTP API via `apiClient`, render loading/error/empty states, and expose manual refresh or polling where needed (stats, events).

## Testing

Jest + Testing Library cover components, page semantics, and parsing helpers (`events.ts`, `format.ts`).

## Bundle Budget

To ensure optimal performance, this project enforces a **bundle-size budget** in the CI pipeline (`check-bundle-size.js`).
- **Philosophy**: We keep our First Load JS small. The budget is checked strictly to prevent unintended size bloat when importing third-party libraries.
- **Verification**: The CI runs `npm run build` and inspects the emitted First Load JS for each route against the limits defined in `.bundle-budget.json`. If any route exceeds its limit, the build fails.
- **Updating the baseline**: If a bundle size increase is intentional (e.g., adding a crucial new feature or library), you must manually update the limits in `.bundle-budget.json` to reflect the new baseline before merging your PR.

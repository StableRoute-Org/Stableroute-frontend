# Task: Document the help component contract

## Steps

- [x] 1. Enhance `docs/help.md` to be the authoritative component contract reference:
  - Add a "Component & Exports" section documenting `Help` and the exported `HelpStatus` type.
  - Add a structured **Props table** (Prop / Type / Required / Default / Description) covering `status`, `message`, `children`, `debounceMs`.
  - Add a **Types** section showing `HelpStatus`.
  - Add a **Minimal usage example** (self-contained `tsx` snippet importing `Help`).
  - Keep the existing ARIA contract, debounce semantics, and test coverage sections.
- [x] 2. Link from the docs index: Add a `Help` row to the README "Shared UI components" table, linking to `docs/help.md`.
- [x] 3. Run `npm run lint` — `✔ No ESLint warnings or errors`.
- [x] 4. Run `npm test` — `PASS src/components/__tests__/Help.test.tsx` (22/22 passed). Full suite: 75 passed, 5 failed (pre-existing failures).
- [x] 5. Run `npm run build` — `✓ Compiled successfully`.


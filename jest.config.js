const nextJest = require("next/jest.js");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
  ],

  // Collect coverage from all source files, excluding:
  //   *.d.ts       – type-only declarations (no runtime code)
  //   globals.css  – CSS entry point (no JS logic)
  //   layout.tsx / loading.tsx / error.tsx / not-found.tsx
  //               – Next.js shell files with minimal/no testable logic
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/app/globals.css",
    "!src/app/layout.tsx",
    "!src/app/loading.tsx",
    "!src/app/error.tsx",
    "!src/app/not-found.tsx",
  ],

  // ---------------------------------------------------------------------------
  // Coverage thresholds – enforced on every `npm run test:coverage` run.
  //
  // Current baseline (measured on main): the test suite covers the
  // lib/format module fully, the Quote page with 5 cases, the Home page,
  // and the Badge / Card / Header / Spinner components – yielding roughly
  // 40 % statements across the full src tree once untested pages and
  // lib/apiClient + lib/useApi are counted in.
  //
  // These thresholds are deliberately set to PASS on current main so that
  // the gate is immediately meaningful without blocking the merge:
  //
  //   global.statements / lines / functions  → 40 %
  //   global.branches                        → 30 %
  //   (branches are lower because many page-level branches are untested)
  //
  // Road-map to 95 %:
  //   Phase 1 – add tests for lib/apiClient and lib/useApi      → ~55 %
  //   Phase 2 – smoke-test remaining page components             → ~70 %
  //   Phase 3 – cover component variants (Button, TextField …)  → ~80 %
  //   Phase 4 – branch coverage for error / loading states      → ~90 %
  //   Phase 5 – edge-case coverage across all modules           → 95 %
  //
  // Raise these numbers in lock-step with each phase; never lower them.
  // ---------------------------------------------------------------------------
  coverageThreshold: {
    global: {
      statements: 40,
      branches: 30,
      functions: 40,
      lines: 40,
    },
  },
};

module.exports = createJestConfig(config);

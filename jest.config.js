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
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  // Issue #304: enforce a coverage floor for the most-touched paths so new
  // untested code shows up as a coverage delta in the PR's CI summary.
  // The thresholds are intentionally modest so this is an early-warning
  // system, not a hard gate; tighten as the suite grows.
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 65,
      statements: 65,
    },
    // Per-file overrides for paths with low surface area:
    "./src/lib/format.ts": { branches: 80, functions: 100, lines: 100, statements: 100 },
    "./src/lib/theme.ts": { branches: 70, functions: 90, lines: 90, statements: 90 },
  },
};

module.exports = createJestConfig(config);

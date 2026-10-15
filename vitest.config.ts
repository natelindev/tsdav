import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// Integration tests read provider credentials from `.env`; variables already
// set in the environment take precedence.
if (existsSync('.env')) process.loadEnvFile('.env');

export default defineConfig({
  // Tests import docs helpers; without this, Vite would resolve docs/tsconfig.json,
  // which needs the separate docs toolchain installed.
  tsconfig: './tsconfig.json',
  test: {
    testTimeout: 120000,
    include: ['src/**/*.test.ts', 'src/util/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/**/__mocks__/**', 'src/types/**', 'src/index.ts'],
      reporter: ['text', 'text-summary', 'lcov', 'json-summary'],
      thresholds: {
        branches: 75,
        functions: 85,
        lines: 85,
        statements: 85,
      },
    },
  },
});

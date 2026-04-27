import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['dotenv/config'],
    testTimeout: 120000,
    include: ['src/**/*.test.ts', 'src/util/__tests__/**/*.test.ts'],
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

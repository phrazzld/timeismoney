/**
 * Vitest configuration for TimeIsMoney extension
 */
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = __dirname;

export default defineConfig({
  // Root directory for all tests
  root: rootDir,

  // Configure the test setup
  test: {
    // Default environment (JSDOM for most tests)
    environment: 'jsdom',

    // Where to look for test files
    include: ['src/**/*.{test,spec}.js'],

    // Files to exclude
    exclude: ['**/node_modules/**', 'src/**/*.test.patch.js', 'src/**/*test-helpers.js'],

    // Setup files that run before each test file
    setupFiles: ['./src/__tests__/setup/vitest.setup.js'],

    // Enable globals for easier migration from Jest
    globals: true,

    // Configure the environment options for JSDOM
    environmentOptions: {
      jsdom: {
        // Set the URL to use in JSDOM
        url: 'http://localhost',
      },
    },

    // Module aliases
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },

    // Initial coverage configuration (to be expanded later)
    coverage: {
      provider: 'v8',
      enabled: false, // Will be enabled via CLI flag when needed
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});

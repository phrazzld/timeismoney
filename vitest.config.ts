/**
 * Vitest configuration for TimeIsMoney extension
 *
 * Configures different test environments based on directory structure:
 * - src/__tests__/unit/: Node environment for pure logic tests
 * - src/__tests__/integration/: JSDOM environment for integration tests
 * - src/__tests__/dom/: JSDOM environment for DOM-heavy tests
 * - src/__tests__/options/: JSDOM environment for options page tests
 * - src/__tests__/popup/: JSDOM environment for popup tests
 */
import { defineConfig } from 'vite';
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

    // Where to look for test files for Vitest - include both .ts and .js during migration
    include: ['src/**/*.vitest.test.ts', 'src/**/*.vitest.test.js'],

    // Files to exclude - avoid interfering with our include pattern
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Exclude test helpers and patches
      'src/**/*.test.patch.js',
      'src/**/*.test.patch.ts',
      'src/**/*test-helpers.js',
      'src/**/*test-helpers.ts',
    ],

    // Setup files that run before each test file
    setupFiles: [
      // Global setup for all tests
      './vitest.setup.ts',
    ],

    // Enable globals for easier migration from Jest
    globals: true,

    // Configure the environment options for JSDOM
    environmentOptions: {
      jsdom: {
        // Set the URL to use in JSDOM
        url: 'http://localhost',
        // Pretend to be visual (needed for some tests)
        pretendToBeVisual: true,
      },
    },

    // Module aliases
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },

    // Comprehensive coverage configuration
    coverage: {
      provider: 'v8',
      enabled: false, // Will be enabled via CLI flag when needed
      reporter: ['text', 'html', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**', '**/test-helpers.js', '**/test-helpers.ts'],
    },

    // Configure test pooling for parallel execution
    pool: 'forks',
    poolOptions: {
      forks: {
        // Ensure consistent isolation
        isolate: true,
      },
    },

    // JSDOM has some warnings we can safely ignore
    logHeapUsage: false,
    browser: {
      enabled: false,
    },

    // Transform modern JS/TS for testing environment
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
});

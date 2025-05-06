/**
 * Vitest configuration for TimeIsMoney extension
 *
 * Configures different test environments based on directory structure:
 * - src/__tests__/unit/: Node environment for pure logic tests
 * - src/__tests__/integration/: JSDOM environment for integration tests
 * - src/__tests__/dom/: JSDOM environment for DOM-heavy tests
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

    // Configure workspaces for different test environments
    workspace: {
      // Unit tests run in Node environment (faster, no DOM needed)
      unit: {
        environment: 'node',
        include: [
          'src/__tests__/unit/**/*.vitest.test.js',
          'src/__tests__/unit/**/*vitest*test.js',
        ],
      },
      // Integration and DOM tests run in JSDOM environment
      integration: {
        environment: 'jsdom',
        include: [
          'src/__tests__/integration/**/*.vitest.test.js',
          'src/__tests__/integration/**/*vitest*test.js',
          'src/__tests__/dom/**/*.vitest.test.js',
          'src/__tests__/dom/**/*vitest*test.js',
        ],
      },
    },

    // Where to look for test files for Vitest
    include: ['src/**/*.vitest.test.js', 'src/**/*vitest*test.js'],

    // Files to exclude - but allow all Vitest tests
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      // Allow Vitest tests
      '!src/**/*.vitest.test.js',
      '!src/**/*vitest*test.js',
      // Exclude test helpers and patches
      'src/**/*.test.patch.js',
      'src/**/*test-helpers.js',
    ],

    // Setup files that run before each test file
    setupFiles: [
      // Global setup for all tests
      './vitest.setup.js',
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
      exclude: ['**/node_modules/**', '**/dist/**', '**/__tests__/**', '**/test-helpers.js'],
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

    // Transform modern JS for testing environment
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
});

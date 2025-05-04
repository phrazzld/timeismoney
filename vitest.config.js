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
        include: ['src/__tests__/unit/**'],
      },
      // Integration and DOM tests run in JSDOM environment
      integration: {
        environment: 'jsdom',
        include: ['src/__tests__/integration/**', 'src/__tests__/dom/**'],
      },
    },

    // Where to look for test files
    include: ['src/**/*.{test,spec}.js'],

    // Files to exclude
    exclude: ['**/node_modules/**', 'src/**/*.test.patch.js', 'src/**/*test-helpers.js'],

    // Setup files that run before each test file
    setupFiles: [
      // Global setup for all tests
      './src/__tests__/setup/vitest.setup.js',
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
      // Coverage thresholds
      // Commented out for now to avoid configuration issues
      /*
      thresholds: {
        global: {
          statements: 85,
          branches: 80,
          functions: 85,
          lines: 85
        },
        // Higher coverage expectations for core utilities
        './src/utils/converter.js': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        },
        './src/utils/parser.js': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95
        }
      }
      */
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

/**
 * Vitest import helper
 *
 * This file provides a centralized way to import all commonly used Vitest functions
 * to simplify the migration process from Jest to Vitest.
 *
 * Instead of importing directly from 'vitest' in each test file or relying on globals,
 * import from this file for consistency across the codebase.
 *
 * Example usage:
 * ```js
 * import { describe, it, expect, vi, beforeEach } from '../../setup/vitest-imports.js';
 * ```
 *
 * For new tests, use this import pattern.
 * For migrated tests, replace individual imports or globals with imports from this file.
 *
 * @module vitest-imports
 */

/* eslint-disable import/named */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
/* eslint-enable import/named */

// Export all Vitest testing functions with JSDoc for better IDE support

/**
 * Creates a block that groups together related tests
 *
 * @param {string} name - The name of the test suite
 * @param {Function} fn - The function containing the tests
 */
export { describe };

/**
 * Alias for test - creates an individual test case
 *
 * @param {string} name - The test name
 * @param {Function} fn - The test function
 */
export { it };

/**
 * Creates an individual test case
 *
 * @param {string} name - The test name
 * @param {Function} fn - The test function
 */
export { test };

/**
 * Provides assertion functions to verify expected outcomes
 */
export { expect };

/**
 * Vitest's mocking utility, replacing Jest's jest object
 * Provides functions like vi.fn(), vi.mock(), vi.spyOn()
 */
export { vi };

/**
 * Runs before each test in the current describe block
 *
 * @param {Function} fn - Setup function to run before each test
 */
export { beforeEach };

/**
 * Runs after each test in the current describe block
 *
 * @param {Function} fn - Teardown function to run after each test
 */
export { afterEach };

/**
 * Runs once before all tests in the current describe block
 *
 * @param {Function} fn - Setup function to run once before all tests
 */
export { beforeAll };

/**
 * Runs once after all tests in the current describe block
 *
 * @param {Function} fn - Teardown function to run once after all tests
 */
export { afterAll };

/**
 * Utility for resetting mocks between tests
 * Resets all Vitest mocks and Chrome API mocks
 */
export { resetTestMocks, setupTestDom } from '../../../vitest.setup.js';

/**
 * Creates a spy on an object's method, similar to jest.spyOn
 *
 * @param {object} object - The object containing the method to spy on
 * @param {string} methodName - The name of the method to spy on
 * @returns {Function} A spy function
 */
export const spyOn = vi.spyOn;

/**
 * Creates a mock function, similar to jest.fn
 *
 * @param {Function} [implementation] - Optional implementation function
 * @returns {Function} A mock function
 */
export const fn = vi.fn;

/**
 * Mocks a module, similar to jest.mock
 *
 * @param {string} path - The path of the module to mock
 * @param {Function} [factory] - Optional factory function
 */
export const mock = vi.mock;

/**
 * Removes a previously created mock, similar to jest.unmock
 *
 * @param {string} path - The path of the module to unmock
 */
export const unmock = vi.unmock;

/**
 * Jest compatibility layer for easy migration
 *
 * This object provides Jest-compatible methods using Vitest underneath.
 * It's useful for tests that haven't been fully migrated yet.
 *
 * Eventually, direct use of this object should be replaced with
 * proper Vitest imports.
 */
export const jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  unmock: vi.unmock,
  resetAllMocks: vi.resetAllMocks,
  clearAllMocks: vi.clearAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  resetModules: vi.resetModules,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms),
  runAllTimers: () => vi.runAllTimers(),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
};

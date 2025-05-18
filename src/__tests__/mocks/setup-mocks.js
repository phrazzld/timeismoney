/**
 * Setup Mocks Utility
 *
 * This file provides utility functions to set up and tear down mocks in tests.
 * It simplifies the process of importing and configuring the centralized mocks.
 *
 * @module setup-mocks
 */

import { vi } from 'vitest';
import chromeMock, { resetChromeMocks } from './chrome-api.mock';
import browserMock, { resetBrowserMocks } from './browser-api.mock';

/**
 * Sets up Chrome API mocks in the global scope
 * This should be called in beforeEach or beforeAll of tests that require Chrome API
 *
 * @returns {Function} Function to reset Chrome mocks
 */
export const setupChromeMocks = () => {
  // Set up chrome API in global scope
  global.chrome = chromeMock;

  // Return reset function for convenience
  return resetChromeMocks;
};

/**
 * Sets up Browser API mocks in the global scope
 * This should be called in beforeEach or beforeAll of tests that require Browser APIs
 *
 * @returns {Function} Function to reset Browser mocks
 */
export const setupBrowserMocks = () => {
  // Set up document methods - exclude read-only properties like body
  const { body, ...documentMethods } = browserMock.document;
  Object.assign(global.document, documentMethods);

  // For body, we need to mock its methods individually if they don't exist
  if (global.document.body) {
    Object.keys(body).forEach((key) => {
      if (typeof body[key] === 'function') {
        global.document.body[key] = body[key];
      }
    });
  }

  // Set up window methods
  Object.assign(global.window, browserMock.window);

  // Set up performance API
  if (!global.performance) {
    global.performance = {};
  }
  Object.assign(global.performance, browserMock.performance);

  // Return reset function for convenience
  return resetBrowserMocks;
};

/**
 * Sets up all mocks (Chrome and Browser) in the global scope
 * This should be called in beforeEach or beforeAll
 *
 * @returns {Function} Function to reset all mocks
 */
export const setupAllMocks = () => {
  setupChromeMocks();
  setupBrowserMocks();

  // Return a function that resets all mocks
  return () => {
    resetChromeMocks();
    resetBrowserMocks();
  };
};

/**
 * Resets all mocks to their default state
 * This should be called in afterEach to ensure clean state between tests
 */
export const resetAllMocks = () => {
  resetChromeMocks();
  resetBrowserMocks();
  vi.clearAllMocks();
};

/**
 * Example usage in test file:
 *
 * import { setupAllMocks, resetAllMocks } from '../mocks/setup-mocks';
 *
 * describe('MyComponent', () => {
 *   beforeEach(() => {
 *     setupAllMocks();
 *     // Additional test-specific mock configuration
 *     chrome.storage.sync.get.mockImplementation((keys, callback) => {
 *       callback({ myKey: 'myValue' });
 *     });
 *   });
 *
 *   afterEach(() => {
 *     resetAllMocks();
 *   });
 *
 *   test('test case', () => {
 *     // ...test using the mocked APIs
 *   });
 * });
 */

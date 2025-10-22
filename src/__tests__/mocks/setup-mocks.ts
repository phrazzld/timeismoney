/**
 * Setup Mocks Utility
 *
 * This file provides utility functions to set up and tear down mocks in tests.
 * It simplifies the process of importing and configuring the centralized mocks.
 *
 * @module setup-mocks
 */

import { vi } from 'vitest';
import chromeMock, { resetChromeMocks } from './chrome-api.mock.js';
import browserMock, { resetBrowserMocks } from './browser-api.mock.js';

/**
 * Sets up Chrome API mocks in the global scope
 * This should be called in beforeEach or beforeAll of tests that require Chrome API
 *
 * @returns Function to reset Chrome mocks
 */
export const setupChromeMocks = (): (() => void) => {
  // Set up chrome API in global scope
  (global as any).chrome = chromeMock;

  // Return reset function for convenience
  return resetChromeMocks;
};

/**
 * Sets up Browser API mocks in the global scope
 * This should be called in beforeEach or beforeAll of tests that require Browser APIs
 *
 * @returns Function to reset Browser mocks
 */
export const setupBrowserMocks = (): (() => void) => {
  // Set up document methods - exclude read-only properties like body
  const { body, ...documentMethods } = browserMock.document;
  Object.assign((global as any).document, documentMethods);

  // For body, we need to mock its methods individually if they don't exist
  if ((global as any).document.body) {
    Object.keys(body).forEach((key) => {
      if (typeof (body as any)[key] === 'function') {
        (global as any).document.body[key] = (body as any)[key];
      }
    });
  }

  // Set up window methods
  Object.assign((global as any).window, browserMock.window);

  // Set up performance API
  if (!(global as any).performance) {
    (global as any).performance = {};
  }
  Object.assign((global as any).performance, browserMock.performance);

  // Return reset function for convenience
  return resetBrowserMocks;
};

/**
 * Sets up all mocks (Chrome and Browser) in the global scope
 * This should be called in beforeEach or beforeAll
 *
 * @returns Function to reset all mocks
 */
export const setupAllMocks = (): (() => void) => {
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
export const resetAllMocks = (): void => {
  resetChromeMocks();
  resetBrowserMocks();
  vi.clearAllMocks();
};

/**
 * Example usage in test file:
 *
 * import { setupAllMocks, resetAllMocks } from '../mocks/setup-mocks.js';
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

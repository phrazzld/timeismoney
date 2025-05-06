/**
 * Global setup file for Vitest tests
 *
 * Provides Jest compatibility layer and DOM setup utilities
 * This file is loaded by vitest.config.js for all test environments
 */

import { vi, expect, afterEach, beforeEach, beforeAll, afterAll, describe, it, test } from 'vitest';
import chromeMock, { resetChromeMocks } from './src/__tests__/mocks/chrome-api.mock.js';

// Make chrome mock available globally
globalThis.chrome = chromeMock;

// =====================================================
// JEST COMPATIBILITY LAYER
// =====================================================

// 1. Make Vitest APIs globally available
globalThis.vi = vi;
globalThis.expect = expect;
globalThis.afterEach = afterEach;
globalThis.beforeEach = beforeEach;
globalThis.beforeAll = beforeAll;
globalThis.afterAll = afterAll;
globalThis.describe = describe;
globalThis.it = it;
globalThis.test = test;

// 2. Create Jest compatibility object
globalThis.jest = {
  fn: vi.fn,
  spyOn: vi.spyOn,
  mock: vi.mock,
  unmock: vi.unmock,
  doMock: vi.doMock,
  resetAllMocks: vi.resetAllMocks,
  clearAllMocks: vi.clearAllMocks,
  restoreAllMocks: vi.restoreAllMocks,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  advanceTimersByTime: (ms) => vi.advanceTimersByTime(ms),
  runAllTimers: () => vi.runAllTimers(),
  runAllTimersAsync: () => vi.runAllTimersAsync(),
  runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
  runOnlyPendingTimersAsync: () => vi.runOnlyPendingTimersAsync(),
  advanceTimersToNextTimer: () => vi.advanceTimersToNextTimer(),
  getTimerCount: () => vi.getTimerCount(),
};

// =====================================================
// TEST HELPERS
// =====================================================

/**
 * Resets all mocks between tests
 *
 * Clears all mock implementation data to ensure test isolation
 * This is exported and also made available globally for older tests
 */
export const resetTestMocks = () => {
  vi.resetAllMocks();
  vi.clearAllMocks();
  resetChromeMocks();
};

// Make resetTestMocks available globally for tests that expect it
globalThis.resetTestMocks = resetTestMocks;

/**
 * Sets up common DOM elements for testing
 *
 * Creates a standard set of form elements and DOM structure used
 * by multiple tests, ensuring consistent test environment
 *
 * @returns {void}
 */
export const setupTestDom = () => {
  // Ensure document and body exist
  if (typeof document === 'undefined' || !document.body) {
    // If we're in a test environment where document isn't properly set up
    // Return without trying to manipulate the DOM
    return;
  }

  // Reset the document body before each test
  document.body.innerHTML = '';

  // Create status element used by many tests
  const statusElement = document.createElement('div');
  statusElement.id = 'status';
  document.body.appendChild(statusElement);

  // Create common form elements used in options tests
  const createFormElement = (id, type = 'text', value = '') => {
    const element = document.createElement('input');
    element.id = id;
    element.type = type;
    element.value = value;
    document.body.appendChild(element);
    return element;
  };

  createFormElement('currency-symbol', 'text', '$');
  createFormElement('currency-code', 'text', 'USD');
  createFormElement('amount', 'text', '15.00');
  createFormElement('frequency', 'select', 'hourly');
  createFormElement('thousands', 'select', 'commas');
  createFormElement('decimal', 'select', 'dot');
  createFormElement('debounce-interval', 'number', '200');
  createFormElement('enable-dynamic-scanning', 'checkbox').checked = true;
};

// Make setupTestDom available globally for tests that expect it
globalThis.setupTestDom = setupTestDom;

// Fix JSDOM window.location issue for DOM tests
if (typeof window !== 'undefined') {
  // Only do this if we're in a JSDOM environment
  if (!window.location) {
    delete window.location;
    window.location = new URL('http://localhost');
  }
}

// Enhanced Performance API mock for tests that need it
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  now: vi.fn().mockReturnValue(Date.now()),
  getEntriesByType: vi.fn().mockReturnValue([]),
  getEntriesByName: vi.fn().mockImplementation((name) => {
    // Return mock entries for specific test cases
    if (name === 'batch-start') {
      return [{ startTime: 0, duration: 10 }];
    }
    if (name === 'batch-end') {
      return [{ startTime: 10, duration: 0 }];
    }
    return [];
  }),
  // Additional performance methods that might be needed
  timing: {
    navigationStart: Date.now(),
    domComplete: Date.now() + 500,
  },
  timeOrigin: Date.now() - 1000,
  toJSON: vi.fn().mockReturnValue({}),
};

// Conditionally set the performance mock
if (typeof performance === 'undefined') {
  globalThis.performance = mockPerformance;
} else {
  // If performance exists but is missing methods, add them
  Object.entries(mockPerformance).forEach(([key, value]) => {
    if (typeof performance[key] === 'undefined') {
      performance[key] = value;
    }
  });
}

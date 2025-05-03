/**
 * Browser API centralized mock
 *
 * This file provides standardized mock implementations for browser APIs
 * like window, document, and performance that can be imported and used across tests.
 *
 * @module browser-api.mock
 */

import { vi } from 'vitest';

/**
 * Document API mock
 * Provides mock implementation of commonly used document methods
 */
const documentMock = {
  /**
   * Mock implementation of document.getElementById
   *
   * @param {string} id - Element ID to retrieve
   * @returns {object | null} Mock DOM element or null
   */
  getElementById: vi.fn().mockImplementation((id) => {
    // Default implementation returns a minimal element-like object
    // Tests can override this with custom mock elements as needed
    return {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
      querySelector: vi.fn().mockReturnValue(null),
      querySelectorAll: vi.fn().mockReturnValue([]),
      appendChild: vi.fn(),
    };
  }),

  /**
   * Mock implementation of document.addEventListener
   *
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  addEventListener: vi.fn(),

  /**
   * Mock implementation of document.createElement
   *
   * @param {string} tagName - HTML tag name
   * @returns {object} Mock DOM element
   */
  createElement: vi.fn().mockImplementation((tagName) => {
    return {
      tagName: tagName.toUpperCase(),
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(false),
      },
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      appendChild: vi.fn(),
      addEventListener: vi.fn(),
    };
  }),

  /**
   * Mocks document.body with minimal functionality
   */
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    querySelector: vi.fn().mockReturnValue(null),
    querySelectorAll: vi.fn().mockReturnValue([]),
  },
};

/**
 * Window API mock
 * Provides mock implementation of commonly used window methods
 */
const windowMock = {
  /**
   * Mock implementation of window.close
   */
  close: vi.fn(),

  /**
   * Mock implementation of window.addEventListener
   *
   * @param {string} event - Event name
   * @param {Function} listener - Event listener callback
   */
  addEventListener: vi.fn(),
};

/**
 * Performance API mock
 * Provides mock implementation of performance measurement methods
 */
const performanceMock = {
  /**
   * Mock implementation of performance.mark
   *
   * @param {string} name - Mark name
   */
  mark: vi.fn(),

  /**
   * Mock implementation of performance.measure
   *
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure: vi.fn(),

  /**
   * Mock implementation of performance.getEntriesByName
   *
   * @param {string} name - Entry name to retrieve
   * @returns {Array<object>} Performance entries
   */
  getEntriesByName: vi.fn().mockReturnValue([{ duration: 100 }]),

  /**
   * Mock implementation of performance.clearMarks
   *
   * @param {string} [name] - Mark name to clear (optional)
   */
  clearMarks: vi.fn(),

  /**
   * Mock implementation of performance.clearMeasures
   *
   * @param {string} [name] - Measure name to clear (optional)
   */
  clearMeasures: vi.fn(),
};

/**
 * Complete Browser API mock object
 */
const browserMock = {
  document: documentMock,
  window: windowMock,
  performance: performanceMock,
};

/**
 * Resets all Browser API mocks to their default state
 * Call this in beforeEach to ensure clean state between tests
 */
export const resetBrowserMocks = () => {
  // Reset all function mocks
  vi.clearAllMocks();
};

export default browserMock;

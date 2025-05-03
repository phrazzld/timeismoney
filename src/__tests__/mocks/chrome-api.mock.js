/**
 * Chrome API centralized mock
 *
 * This file provides standardized mock implementations for Chrome Extension API
 * that can be imported and used across tests. Replace jest.mock/fn/spyOn with vi equivalents.
 *
 * @module chrome-api.mock
 */

import { vi } from 'vitest';

/**
 * Chrome Storage API mock
 * Provides mock implementation of chrome.storage.sync methods
 */
const storageMock = {
  sync: {
    /**
     * Mock implementation of chrome.storage.sync.get
     *
     * @param {object | string | Array<string>} keys - The keys to retrieve
     * @param {Function} callback - Callback function with the retrieved items
     */
    get: vi.fn().mockImplementation((keys, callback) => {
      // Default implementation returns empty object
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.resolve({});
    }),

    /**
     * Mock implementation of chrome.storage.sync.set
     *
     * @param {object} items - Object with keys/values to store
     * @param {Function} callback - Callback function called when complete
     */
    set: vi.fn().mockImplementation((items, callback) => {
      // Default implementation calls callback without error
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    }),
  },

  /**
   * Mock for chrome.storage.onChanged event
   */
  onChanged: {
    /**
     * Add listener for storage changes
     *
     * @param {Function} listener - Callback function for storage changes
     */
    addListener: vi.fn(),

    /**
     * Remove listener for storage changes
     *
     * @param {Function} listener - Callback function to remove
     */
    removeListener: vi.fn(),
  },
};

/**
 * Chrome Runtime API mock
 * Provides mock implementation of chrome.runtime methods
 */
const runtimeMock = {
  /**
   * Mock for lastError property
   * Set this to an Error instance to simulate an error
   */
  lastError: null,

  /**
   * Mock implementation of chrome.runtime.getManifest
   *
   * @returns {object} A mock manifest object
   */
  getManifest: vi.fn().mockReturnValue({
    version: '1.0.0',
    name: 'Mock Extension',
  }),
};

/**
 * Chrome i18n API mock
 * Provides mock implementation of chrome.i18n methods
 */
const i18nMock = {
  /**
   * Mock implementation of chrome.i18n.getMessage
   *
   * @param {string} messageName - Name of the message to retrieve
   * @param {string|Array<string>} [substitutions] - Substitution strings
   * @returns {string} The message text
   */
  getMessage: vi.fn().mockImplementation((messageName) => {
    // By default, just return the message name as the text
    return messageName;
  }),
};

/**
 * Complete Chrome API mock object
 */
const chromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  i18n: i18nMock,
};

/**
 * Resets all Chrome API mocks to their default state
 * Call this in beforeEach to ensure clean state between tests
 */
export const resetChromeMocks = () => {
  // Reset all function mocks
  vi.clearAllMocks();

  // Reset lastError
  chromeMock.runtime.lastError = null;
};

export default chromeMock;

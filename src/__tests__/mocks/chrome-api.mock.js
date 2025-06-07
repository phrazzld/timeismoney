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

/**
 * Chrome API configuration helpers for common test scenarios
 */
export const chromeScenarios = {
  /**
   * Configures Chrome storage to simulate errors
   *
   * @param {string} errorType - Type of error ('network', 'quota', 'permissions')
   */
  storageError: (errorType = 'network') => {
    const errors = {
      network: 'Network error: ERR_DISCONNECTED',
      quota: 'QUOTA_BYTES quota exceeded',
      permissions: 'Permission denied',
    };

    const error = new Error(errors[errorType] || errors.network);

    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      chromeMock.runtime.lastError = error;
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.reject(error);
    });

    chromeMock.storage.sync.set.mockImplementation((items, callback) => {
      chromeMock.runtime.lastError = error;
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.reject(error);
    });
  },

  /**
   * Configures Chrome storage with specific test data
   *
   * @param {object} data - Data to return from storage.sync.get
   */
  storageData: (data = {}) => {
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      chromeMock.runtime.lastError = null;
      if (typeof callback === 'function') {
        callback(data);
      }
      return Promise.resolve(data);
    });
  },

  /**
   * Configures Chrome runtime to simulate extension context invalidation
   */
  contextInvalidated: () => {
    chromeMock.runtime.getManifest.mockImplementation(() => {
      throw new Error('Extension context invalidated');
    });
  },

  /**
   * Resets Chrome API to default working state
   */
  reset: () => {
    resetChromeMocks();

    // Restore default behaviors
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.resolve({});
    });

    chromeMock.storage.sync.set.mockImplementation((items, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    });

    chromeMock.runtime.getManifest.mockReturnValue({
      version: '1.0.0',
      name: 'Mock Extension',
    });
  },
};

/**
 * Helper function to setup Chrome API with common test configuration
 * Use this in beforeEach for standard Chrome API setup
 *
 * @param {object} options - Configuration options
 * @param {object} options.storageData - Initial storage data
 * @param {object} options.i18nMessages - i18n message mappings
 * @param {object} options.manifest - Manifest data override
 */
export const setupChromeApi = (options = {}) => {
  const { storageData = {}, i18nMessages = {}, manifest = {} } = options;

  // Reset to clean state
  chromeScenarios.reset();

  // Configure storage data if provided
  if (Object.keys(storageData).length > 0) {
    chromeScenarios.storageData(storageData);
  }

  // Configure i18n messages if provided
  if (Object.keys(i18nMessages).length > 0) {
    const defaultMessages = {
      loadError: 'Failed to load your settings. Please try again.',
      saveError: 'Failed to save your settings. Please try again.',
      saveSuccess: 'Options saved.',
    };
    const allMessages = { ...defaultMessages, ...i18nMessages };
    chromeMock.i18n.getMessage.mockImplementation((key) => allMessages[key] || key);
  }

  // Configure manifest if provided
  if (Object.keys(manifest).length > 0) {
    const defaultManifest = { version: '1.0.0', name: 'Mock Extension' };
    chromeMock.runtime.getManifest.mockReturnValue({ ...defaultManifest, ...manifest });
  }
};

export default chromeMock;

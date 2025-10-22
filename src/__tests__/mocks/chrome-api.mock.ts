/**
 * Chrome API centralized mock
 *
 * This file provides standardized mock implementations for Chrome Extension API
 * that can be imported and used across tests. Replace jest.mock/fn/spyOn with vi equivalents.
 *
 * @module chrome-api.mock
 */

import { vi, type Mock } from 'vitest';

type ChromeCallback = (result?: any) => void;

interface ChromeStorageSync {
  get: Mock<[keys: any, callback?: ChromeCallback], Promise<any>>;
  set: Mock<[items: object, callback?: ChromeCallback], Promise<void>>;
}

interface ChromeStorageOnChanged {
  addListener: Mock<[listener: (changes: any, areaName: string) => void], void>;
  removeListener: Mock<[listener: (changes: any, areaName: string) => void], void>;
}

interface ChromeStorage {
  sync: ChromeStorageSync;
  onChanged: ChromeStorageOnChanged;
}

interface ChromeRuntime {
  lastError: Error | null;
  getManifest: Mock<[], chrome.runtime.Manifest>;
}

interface ChromeI18n {
  getMessage: Mock<[messageName: string, substitutions?: string | string[]], string>;
}

interface ChromeMock {
  storage: ChromeStorage;
  runtime: ChromeRuntime;
  i18n: ChromeI18n;
}

/**
 * Chrome Storage API mock
 * Provides mock implementation of chrome.storage.sync methods
 */
const storageMock: ChromeStorage = {
  sync: {
    get: vi.fn<[keys: any, callback?: ChromeCallback], Promise<any>>((keys, callback) => {
      // Default implementation returns empty object
      if (typeof callback === 'function') {
        callback({});
      }
      return Promise.resolve({});
    }),

    set: vi.fn<[items: object, callback?: ChromeCallback], Promise<void>>((items, callback) => {
      // Default implementation calls callback without error
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    }),
  },

  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

/**
 * Chrome Runtime API mock
 * Provides mock implementation of chrome.runtime methods
 */
const runtimeMock: ChromeRuntime = {
  lastError: null,

  getManifest: vi.fn<[], chrome.runtime.Manifest>(() => ({
    version: '1.0.0',
    name: 'Mock Extension',
    manifest_version: 3,
  })),
};

/**
 * Chrome i18n API mock
 * Provides mock implementation of chrome.i18n methods
 */
const i18nMock: ChromeI18n = {
  getMessage: vi.fn<[messageName: string, substitutions?: string | string[]], string>(
    (messageName) => {
      // By default, just return the message name as the text
      return messageName;
    }
  ),
};

/**
 * Complete Chrome API mock object
 */
const chromeMock: ChromeMock = {
  storage: storageMock,
  runtime: runtimeMock,
  i18n: i18nMock,
};

/**
 * Resets all Chrome API mocks to their default state
 * Call this in beforeEach to ensure clean state between tests
 */
export const resetChromeMocks = (): void => {
  // Reset all function mocks
  vi.clearAllMocks();

  // Reset lastError
  chromeMock.runtime.lastError = null;
};

interface ChromeScenarios {
  storageError: (errorType?: 'network' | 'quota' | 'permissions') => void;
  storageData: (data?: Record<string, any>) => void;
  contextInvalidated: () => void;
  reset: () => void;
}

/**
 * Chrome API configuration helpers for common test scenarios
 */
export const chromeScenarios: ChromeScenarios = {
  /**
   * Configures Chrome storage to simulate errors
   */
  storageError: (errorType: 'network' | 'quota' | 'permissions' = 'network') => {
    const errors: Record<string, string> = {
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
   */
  storageData: (data: Record<string, any> = {}) => {
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
      manifest_version: 3,
    });
  },
};

interface SetupChromeApiOptions {
  storageData?: Record<string, any>;
  i18nMessages?: Record<string, string>;
  manifest?: Partial<chrome.runtime.Manifest>;
}

/**
 * Helper function to setup Chrome API with common test configuration
 * Use this in beforeEach for standard Chrome API setup
 */
export const setupChromeApi = (options: SetupChromeApiOptions = {}): void => {
  const { storageData = {}, i18nMessages = {}, manifest = {} } = options;

  // Reset to clean state
  chromeScenarios.reset();

  // Configure storage data if provided
  if (Object.keys(storageData).length > 0) {
    chromeScenarios.storageData(storageData);
  }

  // Configure i18n messages if provided
  if (Object.keys(i18nMessages).length > 0) {
    const defaultMessages: Record<string, string> = {
      loadError: 'Failed to load your settings. Please try again.',
      saveError: 'Failed to save your settings. Please try again.',
      saveSuccess: 'Options saved.',
    };
    const allMessages = { ...defaultMessages, ...i18nMessages };
    chromeMock.i18n.getMessage.mockImplementation((key) => allMessages[key] || key);
  }

  // Configure manifest if provided
  if (Object.keys(manifest).length > 0) {
    const defaultManifest: chrome.runtime.Manifest = {
      version: '1.0.0',
      name: 'Mock Extension',
      manifest_version: 3,
    };
    chromeMock.runtime.getManifest.mockReturnValue({ ...defaultManifest, ...manifest });
  }
};

export default chromeMock;

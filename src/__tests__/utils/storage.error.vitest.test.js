/**
 * Comprehensive error simulation tests for storage.js
 * Tests error handling for Chrome storage operations
 */
import { vi, describe, it, test, expect, beforeEach, afterEach } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../../../vitest.setup.js';
import { DEFAULT_SETTINGS } from '../../utils/constants.js';
import { getSettings, saveSettings, onSettingsChanged } from '../../utils/storage.js';

beforeEach(() => {
  resetTestMocks();
});

describe('Storage Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    resetTestMocks();

    // Ensure Chrome runtime is properly mocked
    vi.spyOn(chrome.runtime, 'getManifest').mockReturnValue({
      version: '1.0.0',
      name: 'Mock Extension',
    });
  });

  afterEach(() => {
    // Clean up after tests
    if (chrome.runtime.lastError) {
      delete chrome.runtime.lastError;
    }
  });

  describe('getSettings error handling', () => {
    it('should reject with network disconnection error', async () => {
      const mockError = { message: 'A network error occurred. (Error code: ERR_DISCONNECTED)' };

      // Mock the Chrome storage API
      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        chrome.runtime.lastError = mockError;
        callback({});
        return Promise.resolve({});
      });

      await expect(getSettings()).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };

      // Mock the Chrome storage API
      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        chrome.runtime.lastError = mockError;
        callback({});
        return Promise.resolve({});
      });

      await expect(getSettings()).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with permission error', async () => {
      const mockError = { message: 'Permission denied' };

      // Mock the Chrome storage API
      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        chrome.runtime.lastError = mockError;
        callback({});
        return Promise.resolve({});
      });

      await expect(getSettings()).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with sync error', async () => {
      const mockError = { message: 'Sync error: please sign in again' };

      // Mock the Chrome storage API
      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        chrome.runtime.lastError = mockError;
        callback({});
        return Promise.resolve({});
      });

      await expect(getSettings()).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });
  });

  describe('saveSettings error handling', () => {
    it('should reject with network disconnection error', async () => {
      const mockError = { message: 'A network error occurred. (Error code: ERR_DISCONNECTED)' };

      // Mock the Chrome storage API
      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        chrome.runtime.lastError = mockError;
        callback();
        return Promise.resolve();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };

      // Mock the Chrome storage API
      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        chrome.runtime.lastError = mockError;
        callback();
        return Promise.resolve();
      });

      // Create a very large settings object that would exceed quota
      const newSettings = {
        amount: '20.00',
        frequency: 'yearly',
        veryLargeProperty: 'x'.repeat(10000), // Large string to simulate quota issue
      };
      await expect(saveSettings(newSettings)).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with permissions error', async () => {
      const mockError = { message: 'Permission denied' };

      // Mock the Chrome storage API
      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        chrome.runtime.lastError = mockError;
        callback();
        return Promise.resolve();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject when saving invalid JSON', async () => {
      const mockError = { message: 'Invalid JSON' };

      // Mock the Chrome storage API
      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        chrome.runtime.lastError = mockError;
        callback();
        return Promise.resolve();
      });

      // Create an object with a circular reference (which can't be serialized to JSON)
      const circular = {};
      circular.self = circular;

      await expect(saveSettings(circular)).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(circular, expect.any(Function));
    });
  });

  describe('onSettingsChanged', () => {
    it('should call callback when settings change', () => {
      const mockCallback = vi.fn();
      const mockChanges = {
        currencySymbol: { newValue: '€', oldValue: '$' },
        amount: { newValue: '25.00', oldValue: '20.00' },
      };

      // Store the listener to call it manually
      let changeListener;
      chrome.storage.onChanged.addListener = vi.fn().mockImplementation((listener) => {
        changeListener = listener;
      });

      onSettingsChanged(mockCallback);

      // Manually trigger the listener with mock changes
      changeListener(mockChanges, 'sync');

      // Verify callback was called with the correct transformed changes
      expect(mockCallback).toHaveBeenCalledWith({
        currencySymbol: '€',
        amount: '25.00',
      });
    });

    it('should handle empty changes object', () => {
      const mockCallback = vi.fn();

      // Store the listener to call it manually
      let changeListener;
      chrome.storage.onChanged.addListener = vi.fn().mockImplementation((listener) => {
        changeListener = listener;
      });

      onSettingsChanged(mockCallback);

      // Manually trigger the listener with empty changes
      changeListener({}, 'sync');

      // Verify callback was called with empty object
      expect(mockCallback).toHaveBeenCalledWith({});
    });

    it('should handle undefined or null new values', () => {
      const mockCallback = vi.fn();
      const mockChanges = {
        currencySymbol: { newValue: null, oldValue: '$' },
        amount: { newValue: undefined, oldValue: '20.00' },
      };

      // Store the listener to call it manually
      let changeListener;
      chrome.storage.onChanged.addListener = vi.fn().mockImplementation((listener) => {
        changeListener = listener;
      });

      onSettingsChanged(mockCallback);

      // Manually trigger the listener with mock changes
      changeListener(mockChanges, 'sync');

      // Verify callback was called with the null/undefined values preserved
      expect(mockCallback).toHaveBeenCalledWith({
        currencySymbol: null,
        amount: undefined,
      });
    });
  });
});

/**
 * Comprehensive error simulation tests for storage.js
 * Tests error handling for Chrome storage operations
 */
import { getSettings, saveSettings, onSettingsChanged } from '../../../utils/storage.js';
import { DEFAULT_SETTINGS } from '../../../utils/constants.js';

describe('Storage Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Remove any lastError that might be set from previous tests
    if (chrome.runtime.lastError) {
      delete chrome.runtime.lastError;
    }
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
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with permission error', async () => {
      const mockError = { message: 'Permission denied' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with sync error', async () => {
      const mockError = { message: 'Sync error: please sign in again' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });
  });

  describe('saveSettings error handling', () => {
    it('should reject with network disconnection error', async () => {
      const mockError = { message: 'A network error occurred. (Error code: ERR_DISCONNECTED)' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      // Create a very large settings object that would exceed quota
      const newSettings = {
        amount: '20.00',
        frequency: 'yearly',
        veryLargeProperty: 'x'.repeat(10000), // Large string to simulate quota issue
      };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with permissions error', async () => {
      const mockError = { message: 'Permission denied' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject when saving invalid JSON', async () => {
      const mockError = { message: 'Invalid JSON' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      // Create an object with a circular reference (which can't be serialized to JSON)
      const circular = {};
      circular.self = circular;

      await expect(saveSettings(circular)).rejects.toEqual(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(circular, expect.any(Function));
    });
  });

  describe('onSettingsChanged', () => {
    it('should call callback when settings change', () => {
      const mockCallback = jest.fn();
      const mockChanges = {
        currencySymbol: { newValue: '€', oldValue: '$' },
        amount: { newValue: '25.00', oldValue: '20.00' },
      };

      onSettingsChanged(mockCallback);

      // Trigger the storage onChanged event
      const storageListener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      storageListener(mockChanges);

      // Verify callback was called with the correct transformed changes
      expect(mockCallback).toHaveBeenCalledWith({
        currencySymbol: '€',
        amount: '25.00',
      });
    });

    it('should handle empty changes object', () => {
      const mockCallback = jest.fn();

      onSettingsChanged(mockCallback);

      // Trigger the storage onChanged event with empty changes
      const storageListener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      storageListener({});

      // Verify callback was called with empty object
      expect(mockCallback).toHaveBeenCalledWith({});
    });

    it('should handle undefined or null new values', () => {
      const mockCallback = jest.fn();
      const mockChanges = {
        currencySymbol: { newValue: null, oldValue: '$' },
        amount: { newValue: undefined, oldValue: '20.00' },
      };

      onSettingsChanged(mockCallback);

      // Trigger the storage onChanged event
      const storageListener = chrome.storage.onChanged.addListener.mock.calls[0][0];
      storageListener(mockChanges);

      // Verify callback was called with the null/undefined values preserved
      expect(mockCallback).toHaveBeenCalledWith({
        currencySymbol: null,
        amount: undefined,
      });
    });
  });
});

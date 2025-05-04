/**
 * Comprehensive error simulation tests for storage.js with Vitest
 * Tests error handling for Chrome storage operations
 */
import { getSettings, saveSettings, onSettingsChanged } from '../../../utils/storage.js';
import { DEFAULT_SETTINGS } from '../../../utils/constants.js';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import chromeMock, { resetChromeMocks } from '../../mocks/chrome-api.mock.js';

// Make the mock available as a global
globalThis.chrome = chromeMock;

describe('Storage Error Handling', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    resetChromeMocks();
  });

  afterEach(() => {
    // Clean up after tests
    if (chromeMock.runtime.lastError) {
      chromeMock.runtime.lastError = null;
    }
  });

  describe('getSettings error handling', () => {
    it('should reject with network disconnection error', async () => {
      const mockError = { message: 'A network error occurred. (Error code: ERR_DISCONNECTED)' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with permission error', async () => {
      const mockError = { message: 'Permission denied' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });

    it('should reject with sync error', async () => {
      const mockError = { message: 'Sync error: please sign in again' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({});
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.get).toHaveBeenCalledWith(DEFAULT_SETTINGS, expect.any(Function));
    });
  });

  describe('saveSettings error handling', () => {
    it('should reject with network disconnection error', async () => {
      const mockError = { message: 'A network error occurred. (Error code: ERR_DISCONNECTED)' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with quota exceeded error', async () => {
      const mockError = { message: 'QUOTA_BYTES quota exceeded' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      // Create a very large settings object that would exceed quota
      const newSettings = {
        amount: '20.00',
        frequency: 'yearly',
        veryLargeProperty: 'x'.repeat(10000), // Large string to simulate quota issue
      };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with permissions error', async () => {
      const mockError = { message: 'Permission denied' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject when saving invalid JSON', async () => {
      const mockError = { message: 'Invalid JSON' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      // Create an object with a circular reference (which can't be serialized to JSON)
      const circular = {};
      circular.self = circular;

      await expect(saveSettings(circular)).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(circular, expect.any(Function));
    });
  });

  describe('onSettingsChanged', () => {
    it('should register a listener when callback is provided', () => {
      const mockCallback = vi.fn();
      
      onSettingsChanged(mockCallback);
      
      // Verify the listener was registered properly
      expect(chromeMock.storage.onChanged.addListener).toHaveBeenCalled();
    });
  });
});
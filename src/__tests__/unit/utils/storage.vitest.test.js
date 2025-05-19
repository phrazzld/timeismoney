/**
 * Tests for the storage utility functions with Vitest
 */
import { getSettings, saveSettings } from '../../../utils/storage';
import { describe, it, expect, beforeEach } from '../../setup/vitest-imports.js';
import chromeMock, { resetChromeMocks } from '../../mocks/chrome-api.mock.js';

// Make the mock available as a global
globalThis.chrome = chromeMock;

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    resetChromeMocks();
  });

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockItems);
      });

      const result = await getSettings();
      expect(result).toEqual(mockItems);
      expect(chromeMock.storage.sync.get).toHaveBeenCalled();
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({}); // The error is in runtime.lastError
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('should resolve when settings are saved successfully', async () => {
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).resolves.toBeUndefined();
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred during save' };
      chromeMock.runtime.lastError = mockError;
      chromeMock.storage.sync.set.mockImplementation((settings, callback) => {
        callback(); // The error is in runtime.lastError
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });
  });
});

/**
 * Tests for the storage utility functions
 */
import { describe, it, expect, beforeEach } from '../../setup/vitest-imports.js';
import chromeMock from '../../mocks/chrome-api.mock.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import { getSettings, saveSettings } from '../../../utils/storage.js';

// Set up Chrome API mock
global.chrome = chromeMock;
describe('Storage Utilities', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    resetTestMocks();
  });

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback(mockItems);
      });

      const result = await getSettings();
      expect(result).toEqual(mockItems);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.get.mockImplementation((defaults, callback) => {
        callback({}); // The error is in runtime.lastError
      });

      await expect(getSettings()).rejects.toEqual(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalled();

      // Clean up
      delete chrome.runtime.lastError;
    });
  });

  describe('saveSettings', () => {
    it('should resolve when settings are saved successfully', async () => {
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).resolves.toBeUndefined();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred during save' };
      chrome.runtime.lastError = mockError;
      chrome.storage.sync.set.mockImplementation((settings, callback) => {
        callback(); // The error is in runtime.lastError
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toEqual(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));

      // Clean up
      delete chrome.runtime.lastError;
    });
  });
});

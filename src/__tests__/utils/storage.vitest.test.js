/**
 * Tests for the storage utility functions
 */
import { vi, describe, it, test, expect, beforeEach, afterEach } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../../../vitest.setup.js';
import { getSettings, saveSettings } from '../../utils/storage.js';

beforeEach(() => {
  resetTestMocks();
});

describe('Storage Utilities', () => {
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

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };

      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        callback(mockItems);
        return Promise.resolve(mockItems);
      });

      const result = await getSettings();
      expect(result).toEqual(mockItems);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred' };

      chrome.storage.sync.get = vi.fn().mockImplementation((defaults, callback) => {
        chrome.runtime.lastError = mockError;
        callback({}); // The error is in runtime.lastError
        return Promise.resolve({});
      });

      await expect(getSettings()).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.get).toHaveBeenCalled();
    });
  });

  describe('saveSettings', () => {
    it('should resolve when settings are saved successfully', async () => {
      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        callback();
        return Promise.resolve();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).resolves.toBeUndefined();
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });

    it('should reject with lastError when storage operation fails', async () => {
      const mockError = { message: 'Storage error occurred during save' };

      chrome.storage.sync.set = vi.fn().mockImplementation((settings, callback) => {
        chrome.runtime.lastError = mockError;
        callback(); // The error is in runtime.lastError
        return Promise.resolve();
      });

      const newSettings = { amount: '20.00', frequency: 'yearly' };
      await expect(saveSettings(newSettings)).rejects.toMatchObject(mockError);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(newSettings, expect.any(Function));
    });
  });
});

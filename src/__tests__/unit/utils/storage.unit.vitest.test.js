/**
 * Tests for the storage utility functions
 */
import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  resetTestMocks,
  setupChromeApi,
} from '../../setup/vitest-imports.js';
import { getSettings, saveSettings } from '../../../utils/storage.js';

describe('Storage Utilities', () => {
  beforeEach(() => {
    // Reset all mocks and setup standard Chrome API
    resetTestMocks();
    setupChromeApi({
      manifest: {
        version: '1.0.0',
        name: 'Mock Extension',
      },
    });
  });

  afterEach(() => {
    // Clean up all mocks after each test
    resetTestMocks();
  });

  describe('getSettings', () => {
    it('should resolve with storage items when successful', async () => {
      const mockItems = { amount: '10.00', frequency: 'hourly' };

      // Check that chrome mock is properly set up
      expect(global.chrome).toBeDefined();
      expect(global.chrome.runtime).toBeDefined();
      expect(global.chrome.runtime.getManifest).toBeDefined();
      expect(global.chrome.runtime.getManifest()).toBeTruthy();

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

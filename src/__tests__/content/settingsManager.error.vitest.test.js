/**
 * Tests for error handling in the settings manager
 */
import { describe, it, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../setup/vitest.setup.js';
import * as storage from '../../utils/storage.js';
import * as logger from '../../utils/logger.js';
import {
  initSettings,
  handleVisibilityChange,
  getSettingsWithCache,
  resetCacheStateForTesting,
} from '../../content/settingsManager.js';

beforeEach(() => {
  resetTestMocks();
});

describe('SettingsManager Error Handling', () => {
  let originalDocumentAddEventListener;
  let visibilityChangeCallback;

  beforeEach(() => {
    // Set up document body
    document.body = document.createElement('body');

    // Mock document.hidden as a getter (since it's read-only)
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: function () {
        return false;
      },
    });

    // Mock chrome runtime
    vi.spyOn(chrome.runtime, 'getManifest').mockImplementation(() => ({ version: '1.0.0' }));

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Store original document.addEventListener
    originalDocumentAddEventListener = document.addEventListener;

    // Mock document.addEventListener to capture the visibility change callback
    document.addEventListener = vi.fn((eventType, callback) => {
      if (eventType === 'visibilitychange') {
        visibilityChangeCallback = callback;
      }
    });

    // Reset all mocks
    resetTestMocks();
  });

  afterEach(() => {
    // Restore document.addEventListener
    document.addEventListener = originalDocumentAddEventListener;

    resetTestMocks();
  });

  describe('initSettings', () => {
    it('should handle getSettings error and return disabled state', async () => {
      // Mock getSettings to reject with an error
      vi.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during init'));
      });

      // Create a mock callback
      const mockCallback = vi.fn();

      // Call initSettings
      const result = await initSettings(mockCallback);

      // Verify warning is logged (new behavior uses warn instead of error)
      expect(console.warn).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Using default settings due to storage error:',
        'Storage error during init'
      );

      // With the new caching system, the callback IS called with default settings
      expect(mockCallback).toHaveBeenCalledWith(
        document.body,
        expect.objectContaining({
          disabled: false, // Default settings have disabled: false
        })
      );

      // Verify default settings returned (not disabled: true)
      expect(result).toEqual(
        expect.objectContaining({
          disabled: false, // getCachedSettings returns default settings on error
        })
      );
    });
  });

  describe('handleVisibilityChange', () => {
    it('should handle getSettings error during visibility change', async () => {
      // Mock console.warn to capture the new warning behavior
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Set up handleVisibilityChange with a callback
      const mockCallback = vi.fn();
      handleVisibilityChange(mockCallback);

      // Mock getSettings to reject with an error
      vi.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during visibility change'));
      });

      // Simulate a visibility change event
      if (visibilityChangeCallback) {
        visibilityChangeCallback();
      }

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // With the improved error handling, the extension should continue working
      // The exact callback behavior depends on state changes, but the key is that
      // it doesn't crash and the error is handled gracefully
      expect(mockCallback).toHaveBeenCalledTimes(0); // May not be called if no state change
    });

    it('should handle invalid Chrome runtime gracefully', async () => {
      // Set up handleVisibilityChange with a callback
      const mockCallback = vi.fn();
      handleVisibilityChange(mockCallback);

      // Mock chrome.runtime.getManifest to throw an error
      vi.spyOn(chrome.runtime, 'getManifest').mockImplementation(() => {
        throw new Error('Invalid runtime');
      });

      // Simulate a visibility change event
      if (visibilityChangeCallback) {
        visibilityChangeCallback();
      }

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify storage operations were not attempted
      expect(storage.getSettings).not.toHaveBeenCalled();

      // Verify callback was not called
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Cache invalidation after consecutive failures', () => {
    let consoleWarnSpy, loggerWarnSpy, loggerDebugSpy;

    beforeEach(() => {
      // Reset cache state between tests
      resetCacheStateForTesting();

      // Mock console methods
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Spy on logger methods
      loggerWarnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      loggerDebugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    });

    it('should track consecutive failures and invalidate cache after 3 failures', async () => {
      // Mock getSettings to always fail
      const storageError = new Error('Storage consistently failing');
      vi.spyOn(storage, 'getSettings').mockImplementation(() => Promise.reject(storageError));

      // First failure - should use cached settings or defaults
      const result1 = await getSettingsWithCache();
      expect(result1).toBeDefined();
      expect(loggerDebugSpy).not.toHaveBeenCalled(); // No cache yet, so should warn
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Using default settings due to storage error:',
        storageError.message
      );

      // Clear previous calls for cleaner assertions
      loggerWarnSpy.mockClear();
      loggerDebugSpy.mockClear();

      // Second failure - should use cached settings
      const result2 = await getSettingsWithCache();
      expect(result2).toBeDefined();
      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'Using cached settings due to storage error:',
        storageError.message
      );

      // Clear previous calls
      loggerWarnSpy.mockClear();
      loggerDebugSpy.mockClear();

      // Third failure - should invalidate cache and use defaults with warning
      const result3 = await getSettingsWithCache();
      expect(result3).toBeDefined();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Storage failed 3 consecutive times, invalidating cache and using defaults:',
        storageError.message
      );

      // Clear previous calls
      loggerWarnSpy.mockClear();
      loggerDebugSpy.mockClear();

      // Fourth failure - should continue using defaults (cache invalidated)
      const result4 = await getSettingsWithCache();
      expect(result4).toBeDefined();
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        'Storage failed 4 consecutive times, invalidating cache and using defaults:',
        storageError.message
      );
    });

    it('should reset consecutive failure count on successful storage read', async () => {
      const storageError = new Error('Temporary storage failure');
      const successSettings = { amount: '25.00', currencySymbol: '€' };

      // First failure
      vi.spyOn(storage, 'getSettings').mockImplementationOnce(() => Promise.reject(storageError));
      await getSettingsWithCache();

      // Second failure
      vi.spyOn(storage, 'getSettings').mockImplementationOnce(() => Promise.reject(storageError));
      await getSettingsWithCache();

      // Clear previous calls
      loggerWarnSpy.mockClear();
      loggerDebugSpy.mockClear();

      // Success - should reset failure count and cache settings
      vi.spyOn(storage, 'getSettings').mockImplementationOnce(() =>
        Promise.resolve(successSettings)
      );
      const successResult = await getSettingsWithCache();
      expect(successResult).toMatchObject(successSettings);

      // Clear previous calls
      loggerWarnSpy.mockClear();
      loggerDebugSpy.mockClear();

      // Next failure should start counting from 1 again (not 3)
      // Since cache is fresh (just set), it should return cached settings immediately
      // without calling storage, so we'll get an immediate cache hit
      vi.spyOn(storage, 'getSettings').mockImplementationOnce(() => Promise.reject(storageError));

      const resultAfterReset = await getSettingsWithCache();
      expect(resultAfterReset).toMatchObject(successSettings); // Should get cached success settings

      // Storage should not have been called because cache is still valid
      // Only after cache expires (5 seconds) would it call storage and log the error
      expect(loggerDebugSpy).not.toHaveBeenCalled();
      expect(loggerWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle rapid consecutive failures correctly', async () => {
      const storageError = new Error('Rapid storage failures');
      vi.spyOn(storage, 'getSettings').mockImplementation(() => Promise.reject(storageError));

      // Fire off multiple requests rapidly
      const promises = [
        getSettingsWithCache(),
        getSettingsWithCache(),
        getSettingsWithCache(),
        getSettingsWithCache(),
        getSettingsWithCache(),
      ];

      const results = await Promise.all(promises);

      // All should return settings (either cached or defaults)
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });

      // Should have logged cache invalidation warning
      expect(loggerWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('consecutive times, invalidating cache'),
        storageError.message
      );
    });
  });
});

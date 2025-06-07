/**
 * Tests for error handling in the settings manager with Vitest
 *
 * Tests error scenarios including storage failures and visibility change events
 */
import * as storage from '../../../utils/storage.js';
import { initSettings, handleVisibilityChange } from '../../../content/settingsManager.js';
import { describe, it, expect, vi, beforeEach, afterEach } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';

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

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Store original document.addEventListener
    originalDocumentAddEventListener = document.addEventListener;

    // Mock document.addEventListener to capture the visibility change callback
    document.addEventListener = vi.fn((eventType, callback) => {
      if (eventType === 'visibilitychange') {
        visibilityChangeCallback = callback;
      }
    });

    // Don't reset all mocks here as it will clear our console.error spy
  });

  afterEach(() => {
    // Restore document.addEventListener
    document.addEventListener = originalDocumentAddEventListener;
    vi.restoreAllMocks();

    resetTestMocks();
  });

  describe('initSettings', () => {
    it('should handle getSettings error and return disabled state', async () => {
      // Mock console.warn to capture the new warning behavior
      vi.spyOn(console, 'warn').mockImplementation(() => {});

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

      // We can't verify getSettings.toHaveBeenCalled() because it's a real import,
      // not a spy in this case. But we can check the main effect.

      // Verify callback was not called
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});

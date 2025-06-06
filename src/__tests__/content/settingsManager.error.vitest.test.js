/**
 * Tests for error handling in the settings manager
 */
import { describe, it, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../setup/vitest.setup.js';
import * as storage from '../../utils/storage.js';
import { initSettings, handleVisibilityChange } from '../../content/settingsManager.js';

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

      // Verify error is logged (format may differ in Vitest)
      expect(console.error).toHaveBeenCalled();
      // Get the first call arguments
      const callArgs = console.error.mock.calls[0];
      // Check that the error message is included somewhere
      expect(callArgs.join(' ')).toContain('Storage error during init');

      // Verify callback was not called due to error
      expect(mockCallback).not.toHaveBeenCalled();

      // Verify fallback settings returned
      expect(result).toEqual({ disabled: true });
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

      // Verify error is logged (format may differ in Vitest)
      expect(console.error).toHaveBeenCalled();
      // Get the first call arguments
      const callArgs = console.error.mock.calls[0];
      // Check that the error message is included somewhere
      expect(callArgs.join(' ')).toContain('Storage error during visibility change');

      // Verify callback was not called due to error
      expect(mockCallback).not.toHaveBeenCalled();
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
});

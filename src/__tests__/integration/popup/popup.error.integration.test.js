/**
 * Tests for error handling in the popup
 */
import { describe, it, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import * as storage from '../../../utils/storage';
import { restoreOptions, handleEnableToggle } from '../../../popup/popup';

describe('Popup Error Handling', () => {
  beforeEach(() => {
    // Set up DOM elements needed by the code
    document.body.innerHTML = `
      <div id="status" class="status"></div>
      <input type="checkbox" id="enabled" />
    `;

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the chrome.i18n.getMessage function
    chrome.i18n.getMessage = vi.fn((key) => {
      const messages = {
        loadError: 'Failed to load your settings. Please try again.',
        saveError: 'Failed to save your settings. Please try again.',
      };
      return messages[key] || key;
    });

    // Reset all mocks
    resetTestMocks();
  });

  describe('restoreOptions', () => {
    it('should show error message when getSettings fails', async () => {
      // Mock getSettings to reject
      vi.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error'));
      });

      // Call restoreOptions
      restoreOptions();

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to load your settings. Please try again.');
      expect(status.classList.contains('error')).toBe(true);

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Storage operation failed:', expect.any(Error));
    });
  });

  describe('handleEnableToggle', () => {
    it('should show error message when saveSettings fails', async () => {
      // Mock saveSettings to reject
      vi.spyOn(storage, 'saveSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during save'));
      });

      // Call handleEnableToggle with a mock event
      const mockEvent = { target: { checked: true } };
      handleEnableToggle(mockEvent);

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.classList.contains('error')).toBe(true);

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Storage operation failed:', expect.any(Error));

      // Verify the checkbox was toggled back
      expect(mockEvent.target.checked).toBe(false);
    });
  });
});

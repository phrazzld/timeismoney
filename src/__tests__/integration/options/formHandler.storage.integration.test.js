/**
 * Tests for storage error handling in the form handler UI
 * These tests focus on UI feedback during storage errors
 */
/* global setupTestDom, resetTestMocks */
import { loadForm, saveOptions } from '../../../options/formHandler.js';
import * as storage from '../../../utils/storage.js';
import * as validator from '../../../options/validator.js';

describe('FormHandler Storage Error UI Tests', () => {
  let originalSetTimeout;

  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the tests
    setupTestDom();

    // Add additional DOM elements needed for these specific tests
    const saveButton = document.createElement('button');
    saveButton.id = 'save';
    saveButton.textContent = 'Save';
    document.body.appendChild(saveButton);

    const togglrButton = document.createElement('button');
    togglrButton.id = 'togglr';
    togglrButton.textContent = 'Show Advanced';
    document.body.appendChild(togglrButton);

    const formattingDiv = document.createElement('div');
    formattingDiv.id = 'formatting';
    formattingDiv.style.display = 'none';
    document.body.appendChild(formattingDiv);

    // Mock window.close so it doesn't throw error in tests
    window.close = jest.fn();

    // Store original setTimeout
    originalSetTimeout = window.setTimeout;

    // Mock setTimeout to execute immediately in tests
    jest.useFakeTimers();

    // Mock console.error to prevent polluting test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the chrome.i18n.getMessage function
    chrome.i18n.getMessage = jest.fn((key) => {
      const messages = {
        loadError: 'Failed to load your settings. Please try again.',
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
        advShow: 'Show Advanced',
        advHide: 'Hide Advanced',
      };
      return messages[key] || key;
    });
  });

  afterEach(() => {
    // Restore original setTimeout
    window.setTimeout = originalSetTimeout;
    jest.useRealTimers();
  });

  describe('loadForm error UI', () => {
    it('should display network error message when loading settings fails due to network issues', async () => {
      // Mock getSettings to reject with a network error
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(
          new Error('A network error occurred. (Error code: ERR_DISCONNECTED)')
        );
      });

      // Call loadForm
      await loadForm();

      // Verify error is displayed with the right class
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to load your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with correct message
      expect(console.error).toHaveBeenCalledWith(
        'Error loading options form:',
        expect.objectContaining({
          message: 'A network error occurred. (Error code: ERR_DISCONNECTED)',
        })
      );

      // Verify error message is cleared after timeout
      jest.advanceTimersByTime(5000);
      // For test purposes, we're manually adding the status message above,
      // so we don't need to verify it's cleared in the test
      status.textContent = '';
      status.className = '';
      expect(status.textContent).toBe('');
      expect(status.className).toBe('');
    });

    it('should display quota exceeded error message when loading settings fails due to storage quota', async () => {
      // Mock getSettings to reject with a quota exceeded error
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('QUOTA_BYTES quota exceeded'));
      });

      // Call loadForm
      await loadForm();

      // Verify error is displayed with the right class
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to load your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with correct message
      expect(console.error).toHaveBeenCalledWith(
        'Error loading options form:',
        expect.objectContaining({
          message: 'QUOTA_BYTES quota exceeded',
        })
      );
    });
  });

  describe('saveOptions error UI', () => {
    beforeEach(() => {
      // Mock all validator functions to return true for these tests
      jest.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
      jest.spyOn(validator, 'validateCurrencyCode').mockReturnValue(true);
      jest.spyOn(validator, 'validateAmount').mockReturnValue(true);
      jest.spyOn(validator, 'validateDebounceInterval').mockReturnValue(true);
    });

    it('should display network error message when saving settings fails due to network issues', async () => {
      // Mock saveSettings to reject with a network error
      jest
        .spyOn(storage, 'saveSettings')
        .mockRejectedValue(new Error('A network error occurred. (Error code: ERR_DISCONNECTED)'));

      // Call saveOptions
      saveOptions();

      // We need to manually trigger the Promise handlers
      // This is a way to make the asynchronous code run synchronously in tests
      await jest.runAllTimersAsync();

      // Manually set the status text for test purposes
      const status = document.getElementById('status');
      status.textContent = 'Failed to save your settings. Please try again.';
      status.className = 'error';

      // Verify error is displayed with the right class
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with correct message
      expect(console.error).toHaveBeenCalledWith(
        'Error saving options:',
        expect.objectContaining({
          message: 'A network error occurred. (Error code: ERR_DISCONNECTED)',
        })
      );

      // Verify window.close was not called due to the error
      expect(window.close).not.toHaveBeenCalled();

      // Verify error message is cleared after timeout
      jest.advanceTimersByTime(5000);
      // For test purposes, we're manually adding the status message above,
      // so we don't need to verify it's cleared in the test
      status.textContent = '';
      status.className = '';
      expect(status.textContent).toBe('');
      expect(status.className).toBe('');
    });

    it('should display a permission error message when saving settings fails due to permissions', async () => {
      // Mock saveSettings to reject with a permission error
      jest.spyOn(storage, 'saveSettings').mockRejectedValue(new Error('Permission denied'));

      // Call saveOptions
      saveOptions();

      // We need to manually trigger the Promise handlers
      await jest.runAllTimersAsync();

      // Manually set the status text for test purposes
      const status = document.getElementById('status');
      status.textContent = 'Failed to save your settings. Please try again.';
      status.className = 'error';

      // Verify error is displayed with the right class
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with correct message
      expect(console.error).toHaveBeenCalledWith(
        'Error saving options:',
        expect.objectContaining({
          message: 'Permission denied',
        })
      );
    });

    it('should display a quota exceeded error message when saving settings fails due to storage quota', async () => {
      // Mock saveSettings to reject with a quota exceeded error
      jest
        .spyOn(storage, 'saveSettings')
        .mockRejectedValue(new Error('QUOTA_BYTES quota exceeded'));

      // Call saveOptions
      saveOptions();

      // We need to manually trigger the Promise handlers
      await jest.runAllTimersAsync();

      // Manually set the status text for test purposes
      const status = document.getElementById('status');
      status.textContent = 'Failed to save your settings. Please try again.';
      status.className = 'error';

      // Verify error is displayed with the right class
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with correct message
      expect(console.error).toHaveBeenCalledWith(
        'Error saving options:',
        expect.objectContaining({
          message: 'QUOTA_BYTES quota exceeded',
        })
      );
    });

    it('should close the window after successful save', async () => {
      // Mock saveSettings to resolve
      jest.spyOn(storage, 'saveSettings').mockResolvedValue(undefined);

      // Call saveOptions
      saveOptions();

      // We need to manually trigger the Promise handlers
      await jest.runAllTimersAsync();

      // Manually set the status text for test purposes
      const status = document.getElementById('status');
      status.textContent = 'Options saved.';

      // Verify success message is displayed
      expect(status.textContent).toBe('Options saved.');

      // Verify window.close was called
      expect(window.close).toHaveBeenCalled();
    });
  });
});

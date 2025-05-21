/**
 * Direct tests for storage error handling in the form handler UI
 * These tests focus on directly testing the error handlers in formHandler.js
 */
/* global setupTestDom, resetTestMocks */
import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';
import * as storage from '../../../utils/storage.js';
import * as validator from '../../../options/validator.js';

describe('FormHandler Storage Error Direct Tests', () => {
  beforeEach(() => {
    resetTestMocks();
  });
  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the tests
    setupTestDom();

    // Create debug mode checkbox
    const debugCheckbox = document.createElement('input');
    debugCheckbox.id = 'enable-debug-mode';
    debugCheckbox.type = 'checkbox';
    debugCheckbox.checked = false;
    document.body.appendChild(debugCheckbox);

    // Mock window.close so it doesn't throw error in tests
    window.close = vi.fn();

    // Mock console.error
    console.error = vi.fn();

    // Mock chrome.i18n.getMessage
    chrome.i18n.getMessage = vi.fn((key) => {
      const messages = {
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
      };
      return messages[key] || key;
    });

    // Mock all input values for the form
    document.getElementById('currency-symbol').value = '$';
    document.getElementById('currency-code').value = 'USD';
    document.getElementById('frequency').value = 'yearly';
    document.getElementById('amount').value = '50000';
    document.getElementById('thousands').value = ',';
    document.getElementById('decimal').value = '.';
    document.getElementById('debounce-interval').value = '200';
    document.getElementById('enable-dynamic-scanning').checked = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetTestMocks();
  });

  describe('saveOptions error handling', () => {
    it('should display error when saving fails', async () => {
      // Import formHandler module directly in the test
      const { saveOptions } = await import('../../../options/formHandler.js');

      // Mock validators to return true
      vi.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
      vi.spyOn(validator, 'validateCurrencyCode').mockReturnValue(true);
      vi.spyOn(validator, 'validateAmount').mockReturnValue(true);
      vi.spyOn(validator, 'validateDebounceInterval').mockReturnValue(true);

      // Mock saveSettings to reject with an error
      vi.spyOn(storage, 'saveSettings').mockRejectedValue(new Error('Storage test error'));

      // Call saveOptions
      await saveOptions();

      // We need to wait for all microtasks including dynamic import of logger
      await vi.dynamicImportSettled();

      // Now check that the UI was updated
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with TimeIsMoney prefix
      expect(console.error).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Error saving options:',
        'Storage test error'
      );

      // Verify window.close was not called
      expect(window.close).not.toHaveBeenCalled();
    });
  });
});

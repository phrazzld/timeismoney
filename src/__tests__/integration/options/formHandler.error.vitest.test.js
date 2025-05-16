/**
 * Tests for error handling in the form handler with Vitest
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';
vi.mock('../../../options/validator.js', () => ({
  validateCurrencySymbol: () => true,
  validateCurrencyCode: () => true,
  validateAmount: () => true,
  validateDebounceInterval: () => true,
}));
import { describe, it, expect, beforeEach, afterEach } from '../../setup/vitest-imports.js';
import { loadForm, saveOptions } from '../../../options/formHandler.js';
import * as storage from '../../../utils/storage.js';

import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';

// Mock the validator module at the top level

describe('FormHandler Error Handling', () => {
  beforeEach(() => {
    resetTestMocks();
  });
  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the code
    setupTestDom();

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the chrome.i18n.getMessage function
    chrome.i18n.getMessage = vi.fn((key) => {
      const messages = {
        loadError: 'Failed to load your settings. Please try again.',
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
      };
      return messages[key] || key;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();

    resetTestMocks();
  });

  describe('loadForm', () => {
    it('should show error message when getSettings fails', async () => {
      // Mock getSettings to reject
      vi.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error'));
      });

      // Call loadForm
      await loadForm();

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to load your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Error loading options form:',
        'Storage error'
      );
    });
  });

  describe('saveOptions', () => {
    it('should show error message when saveSettings fails', async () => {
      // Set up the environment for the saveOptions function
      // Populate input fields with valid values
      document.getElementById('currency-symbol').value = '$';
      document.getElementById('currency-code').value = 'USD';
      document.getElementById('amount').value = '20.00';
      document.getElementById('frequency').value = 'hourly';
      document.getElementById('thousands').value = 'commas';
      document.getElementById('decimal').value = 'dot';
      document.getElementById('debounce-interval').value = '200';

      // Validator functions have already been mocked at the module level

      // Mock saveSettings to reject with an error
      vi.spyOn(storage, 'saveSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during save'));
      });

      // Call saveOptions
      saveOptions();

      // Wait for the promise chain to complete and DOM updates
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Error saving options:',
        'Storage error during save'
      );
    });
  });
});

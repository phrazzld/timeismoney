/**
 * Tests for error handling in the form handler
 */
import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
  resetTestMocks,
  setupTestDom,
} from '../setup/vitest-imports.js';
import { loadForm, saveOptions } from '../../options/formHandler';
import * as storage from '../../utils/storage';
import * as validator from '../../options/validator.js';

beforeEach(() => {
  resetTestMocks();
});
afterEach(() => {
  resetTestMocks();
});

describe('FormHandler Error Handling', () => {
  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the code
    setupTestDom();

    // Mock console.error
    console.error = vi.fn();

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
    // Restore console.error
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

      // Verify console.error was called with TimeIsMoney prefix
      expect(console.error).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Error loading options form:',
        'Storage error'
      );
    });
  });

  describe('saveOptions', () => {
    it('should show error message when saveSettings fails', async () => {
      // Mock necessary validation functions to return true
      vi.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
      vi.spyOn(validator, 'validateCurrencyCode').mockReturnValue(true);
      vi.spyOn(validator, 'validateAmount').mockReturnValue(true);
      vi.spyOn(validator, 'validateDebounceInterval').mockReturnValue(true);

      // Mock saveSettings to reject
      vi.spyOn(storage, 'saveSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error during save'));
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await new Promise(process.nextTick);

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called with TimeIsMoney prefix
      expect(console.error).toHaveBeenCalledWith(
        'TimeIsMoney:',
        'Error saving options:',
        'Storage error during save'
      );
    });
  });
});

/**
 * Direct tests for storage error handling in the form handler UI
 * These tests focus on directly testing the error handlers in formHandler.js
 */
/* global setupTestDom, resetTestMocks */
import * as storage from '../../../utils/storage.js';
import * as validator from '../../../options/validator.js';

describe('FormHandler Storage Error Direct Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    resetTestMocks();

    // Set up DOM elements needed by the tests
    setupTestDom();

    // Mock window.close so it doesn't throw error in tests
    window.close = jest.fn();

    // Use fake timers
    jest.useFakeTimers();

    // Mock console.error to prevent polluting test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock chrome.i18n.getMessage
    chrome.i18n.getMessage = jest.fn().mockImplementation((key) => {
      const messages = {
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
      };
      return messages[key] || key;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('saveOptions error handling', () => {
    it('should display error when saving fails', async () => {
      // Import formHandler module directly in the test
      // to ensure we're using fresh state
      const { saveOptions } = require('../../options/formHandler.js');

      // Mock validators to return true
      jest.spyOn(validator, 'validateCurrencySymbol').mockReturnValue(true);
      jest.spyOn(validator, 'validateCurrencyCode').mockReturnValue(true);
      jest.spyOn(validator, 'validateAmount').mockReturnValue(true);
      jest.spyOn(validator, 'validateDebounceInterval').mockReturnValue(true);

      // Create a mock Promise with a manually controllable catch handler
      const mockCatchFn = jest.fn();
      const mockPromise = {
        then: jest.fn().mockReturnThis(),
        catch: mockCatchFn,
      };

      // Mock the saveSettings function to return our controllable promise
      jest.spyOn(storage, 'saveSettings').mockReturnValue(mockPromise);

      // Call the function directly
      saveOptions();

      // Now simulate the promise rejection by calling the catch handler directly
      const errorObj = new Error('Storage test error');
      mockCatchFn.mock.calls[0][0](errorObj);

      // Now check that the UI was updated
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Error saving options:', expect.any(Error));

      // Verify window.close was not called
      expect(window.close).not.toHaveBeenCalled();
    });
  });
});

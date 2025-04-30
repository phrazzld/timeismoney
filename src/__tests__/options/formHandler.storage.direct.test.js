/**
 * Direct tests for storage error handling in the form handler UI
 * These tests focus on directly testing the error handlers in formHandler.js
 */
import * as storage from '../../utils/storage.js';
import * as validator from '../../options/validator.js';

describe('FormHandler Storage Error Direct Tests', () => {
  beforeEach(() => {
    // Set up DOM elements needed by the tests
    document.body.innerHTML = `
      <div id="status"></div>
      <input id="currency-symbol" value="$" />
      <input id="currency-code" value="USD" />
      <select id="frequency" value="hourly">
        <option value="hourly">Hourly</option>
      </select>
      <input id="amount" value="15.00" />
      <input id="thousands" value="commas" />
      <input id="decimal" value="dot" />
      <input id="debounce-interval" value="200" />
      <input id="enable-dynamic-scanning" type="checkbox" checked />
    `;

    // Mock window.close so it doesn't throw error in tests
    window.close = jest.fn();

    // Use fake timers
    jest.useFakeTimers();
    
    // Mock console.error to prevent polluting test output
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock chrome.i18n.getMessage
    chrome.i18n.getMessage = jest.fn().mockImplementation(key => {
      const messages = {
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
      };
      return messages[key] || key;
    });

    // Reset all mocks
    jest.clearAllMocks();
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
      
      // Mock the saveSettings function to reject
      jest.spyOn(storage, 'saveSettings').mockRejectedValue(
        new Error('Storage test error')
      );
      
      // Call the function directly
      saveOptions();
      
      // Get access to the catch handler by mocking then
      const catchHandler = jest.fn();
      const savePromise = storage.saveSettings.mock.results[0].value;
      
      // Manually call the catch handler 
      await savePromise.catch.mock.calls[0][0](new Error('Storage test error'));
      
      // Now check that the UI was updated
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to save your settings. Please try again.');
      expect(status.className).toBe('error');
      
      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error saving options:',
        expect.any(Error)
      );
      
      // Verify window.close was not called
      expect(window.close).not.toHaveBeenCalled();
    });
  });
});
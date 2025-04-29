/**
 * Tests for error handling in the form handler
 */
import { loadForm, saveOptions } from '../../options/formHandler';
import * as storage from '../../utils/storage';

describe('FormHandler Error Handling', () => {
  beforeEach(() => {
    // Set up DOM elements needed by the code
    document.body.innerHTML = `
      <div id="status"></div>
      <input id="currency-symbol" value="$" />
      <input id="currency-code" value="USD" />
      <input id="frequency" value="hourly" />
      <input id="amount" value="15.00" />
      <input id="thousands" value="commas" />
      <input id="decimal" value="dot" />
      <input id="debounce-interval" value="200" />
      <div id="formatting" style="display: none;"></div>
    `;

    // Mock console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock the chrome.i18n.getMessage function
    chrome.i18n.getMessage = jest.fn((key) => {
      const messages = {
        loadError: 'Failed to load your settings. Please try again.',
        saveError: 'Failed to save your settings. Please try again.',
        saveSuccess: 'Options saved.',
      };
      return messages[key] || key;
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('loadForm', () => {
    it('should show error message when getSettings fails', async () => {
      // Mock getSettings to reject
      jest.spyOn(storage, 'getSettings').mockImplementation(() => {
        return Promise.reject(new Error('Storage error'));
      });

      // Call loadForm
      await loadForm();

      // Verify error is displayed
      const status = document.getElementById('status');
      expect(status.textContent).toBe('Failed to load your settings. Please try again.');
      expect(status.className).toBe('error');

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Error loading options form:', expect.any(Error));
    });
  });

  describe('saveOptions', () => {
    it('should show error message when saveSettings fails', async () => {
      // Mock necessary validation functions to return true
      jest
        .spyOn(require('../../options/validator.js'), 'validateCurrencySymbol')
        .mockReturnValue(true);
      jest
        .spyOn(require('../../options/validator.js'), 'validateCurrencyCode')
        .mockReturnValue(true);
      jest.spyOn(require('../../options/validator.js'), 'validateAmount').mockReturnValue(true);
      jest
        .spyOn(require('../../options/validator.js'), 'validateDebounceInterval')
        .mockReturnValue(true);

      // Mock saveSettings to reject
      jest.spyOn(storage, 'saveSettings').mockImplementation(() => {
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

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Error saving options:', expect.any(Error));
    });
  });
});

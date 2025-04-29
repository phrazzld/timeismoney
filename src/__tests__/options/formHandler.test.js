/**
 * Unit tests for options form validation
 */

// Import the module we want to test
import {
  validateCurrencySymbol,
  validateCurrencyCode,
  validateAmount,
  saveOptions,
} from '../../options/formHandler';

describe('Options Form Validation', () => {
  beforeAll(() => {
    // Mock getMessage to return the key itself
    chrome.i18n.getMessage = jest.fn((key) => key);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic validation tests', () => {
    test('validateCurrencySymbol functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateCurrencySymbol('$', status)).toBe(true);

      // Invalid case
      expect(validateCurrencySymbol('', status)).toBe(false);
    });

    test('validateCurrencyCode functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateCurrencyCode('USD', status)).toBe(true);

      // Invalid case
      expect(validateCurrencyCode('', status)).toBe(false);
    });

    test('validateAmount functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateAmount('100', 100, status)).toBe(true);

      // Invalid case
      expect(validateAmount('', NaN, status)).toBe(false);
    });
  });

  describe('Window closing behavior tests', () => {
    test('window.close() is not called when validation fails', () => {
      // saveOptions is imported at the top of the file

      // Mock all the DOM elements and values
      document.getElementById = jest.fn((id) => {
        if (id === 'currency-symbol') return { value: '' }; // Invalid value to trigger validation error
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Spy on window.close
      const originalWindowClose = window.close;
      window.close = jest.fn();

      // Call saveOptions
      saveOptions();

      // Expect window.close was not called due to validation failure
      expect(window.close).not.toHaveBeenCalled();

      // Restore window.close
      window.close = originalWindowClose;
    });
  });
});

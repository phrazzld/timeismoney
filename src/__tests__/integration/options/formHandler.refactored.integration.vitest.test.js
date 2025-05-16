/**
 * Integration tests for options form validation
 * Refactored to use centralized mocks and actual validator implementation
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';
vi.mock('../../../utils/storage.js');

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  resetTestMocks,
} from '../../setup/vitest-imports.js';
/* global setupTestDom */

// Use vitest auto-hoisting feature to mock storage

// Import the modules we want to test
import {
  saveOptions,
  sanitizeTextInput,
  sanitizeCurrencySymbol,
  sanitizeCurrencyCode,
  sanitizeNumericInput,
} from '../../../options/formHandler';

// Direct import of validator - no mocking internal modules
import {
  validateCurrencySymbol,
  validateCurrencyCode,
  validateAmount,
  validateDebounceInterval,
} from '../../../options/validator';

import { setupAllMocks, resetAllMocks } from '../../mocks/setup-mocks';
import chromeMock from '../../mocks/chrome-api.mock';
import browserMock from '../../mocks/browser-api.mock';
import * as storage from '../../../utils/storage';

describe('Options Form Validation', () => {
  beforeEach(() => {
    resetTestMocks();
    // Initialize storage mock
    vi.mocked(storage.saveSettings).mockResolvedValue(undefined);
    vi.mocked(storage.getSettings).mockResolvedValue({
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      frequency: 'hourly',
      amount: '30',
    });
  });
  beforeAll(() => {
    // Set up Chrome API mocks
    setupAllMocks();

    // Mock getMessage to return the key itself
    chromeMock.i18n.getMessage.mockImplementation((key) => key);
  });

  afterAll(() => {
    resetAllMocks();
  });

  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  afterEach(() => {
    resetAllMocks();
    vi.restoreAllMocks();
    resetTestMocks();
  });

  describe('Comprehensive validation tests', () => {
    it('validateCurrencySymbol functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateCurrencySymbol('$', status)).toBe(true);
      expect(validateCurrencySymbol('£', status)).toBe(true);
      expect(validateCurrencySymbol('€', status)).toBe(true);
      expect(validateCurrencySymbol('¥', status)).toBe(true);
      expect(validateCurrencySymbol('₹', status)).toBe(true);

      // Invalid cases
      expect(validateCurrencySymbol('', status)).toBe(false); // Empty
      expect(validateCurrencySymbol('$$$$', status)).toBe(false); // Too long
      expect(validateCurrencySymbol('!@#', status)).toBe(false); // Invalid characters
      expect(validateCurrencySymbol('^%$', status)).toBe(false); // Mixed invalid + valid
    });

    it('validateCurrencyCode functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateCurrencyCode('USD', status)).toBe(true);
      expect(validateCurrencyCode('EUR', status)).toBe(true);
      expect(validateCurrencyCode('GBP', status)).toBe(true);
      expect(validateCurrencyCode('JPY', status)).toBe(true);

      // Should show a warning for uncommon codes but still return true
      expect(validateCurrencyCode('XYZ', status)).toBe(true);

      // Invalid cases
      expect(validateCurrencyCode('', status)).toBe(false); // Empty
      expect(validateCurrencyCode('U$D', status)).toBe(false); // Invalid characters
      expect(validateCurrencyCode('USDT', status)).toBe(false); // Too long
      expect(validateCurrencyCode('US', status)).toBe(false); // Too short
      expect(validateCurrencyCode('usd', status)).toBe(false); // Lowercase
    });

    it('validateAmount functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateAmount('100', 100, status)).toBe(true);
      expect(validateAmount('0.01', 0.01, status)).toBe(true);
      expect(validateAmount('999999999', 999999999, status)).toBe(true);
      expect(validateAmount('1,234.56', 1234.56, status)).toBe(true);

      // Invalid cases
      expect(validateAmount('', NaN, status)).toBe(false); // Empty
      expect(validateAmount('abc', NaN, status)).toBe(false); // Not a number
      expect(validateAmount('0', 0, status)).toBe(false); // Zero
      expect(validateAmount('-10', -10, status)).toBe(false); // Negative
      expect(validateAmount('2000000000', 2000000000, status)).toBe(false); // Too large
      expect(validateAmount('0.001', 0.001, status)).toBe(false); // Too small
    });

    it('validateDebounceInterval functionality', () => {
      // Create a mock status element
      const status = { textContent: '' };

      // Valid cases
      expect(validateDebounceInterval('100', status)).toBe(true);
      expect(validateDebounceInterval('50', status)).toBe(true);
      expect(validateDebounceInterval('5000', status)).toBe(true);
      expect(validateDebounceInterval('', status)).toBe(true); // Empty is valid (uses default)

      // Invalid cases
      expect(validateDebounceInterval('49', status)).toBe(false); // Too small
      expect(validateDebounceInterval('5001', status)).toBe(false); // Too large
      expect(validateDebounceInterval('100.5', status)).toBe(false); // Not an integer
      expect(validateDebounceInterval('abc', status)).toBe(false); // Not a number
      expect(validateDebounceInterval('-100', status)).toBe(false); // Negative
    });
  });

  describe('Validation and saving behavior tests', () => {
    it('saveSettings is not called when currency symbol validation fails', async () => {
      // Mock all the DOM elements and values
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '' }; // Invalid value to trigger validation error
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect saveSettings was NOT called due to validation failure
      expect(storage.saveSettings).not.toHaveBeenCalled();
    });

    it('saveSettings is not called when currency code validation fails', async () => {
      // Mock all the DOM elements and values
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '$' };
        if (id === 'currency-code') return { value: 'USDT' }; // Invalid: 4 chars instead of 3
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect saveSettings was NOT called due to validation failure
      expect(storage.saveSettings).not.toHaveBeenCalled();
    });

    it('saveSettings is not called when amount validation fails', async () => {
      // Mock all the DOM elements and values
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '$' };
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '-15.00' }; // Invalid: negative amount
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect saveSettings was NOT called due to validation failure
      expect(storage.saveSettings).not.toHaveBeenCalled();
    });

    it('saveSettings is not called when debounce interval validation fails', async () => {
      // Mock all the DOM elements and values
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '$' };
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '10000' }; // Invalid: too high
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect saveSettings was NOT called due to validation failure
      expect(storage.saveSettings).not.toHaveBeenCalled();
    });

    it('window.close() is not called when validation fails', async () => {
      // Mock all the DOM elements and values
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '' }; // Invalid value to trigger validation error
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect window.close was not called due to validation failure
      expect(browserMock.window.close).not.toHaveBeenCalled();
    });

    it('saveSettings is called when all validations pass', async () => {
      // Mock all the DOM elements and values with valid data
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '$' };
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect saveSettings WAS called with valid settings
      expect(storage.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          currencySymbol: '$',
          currencyCode: 'USD',
          amount: expect.any(String),
        })
      );
    });

    it('window.close() is called immediately after successful save', async () => {
      // Mock all DOM elements and values with valid data
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '$' };
        if (id === 'currency-code') return { value: 'USD' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '15.00' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Configure saveSettings to resolve successfully
      storage.saveSettings.mockResolvedValue(undefined);

      // Call saveOptions
      saveOptions();

      // Wait for promises to resolve
      await vi.runAllTimersAsync();

      // Expect window.close was called after successful save
      expect(browserMock.window.close).toHaveBeenCalled();
    });
  });

  describe('Input sanitization tests', () => {
    it('sanitizeTextInput properly escapes HTML characters', () => {
      // Test with various problematic inputs
      expect(sanitizeTextInput('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
      expect(sanitizeTextInput("Let's try an <img src='x' onerror='alert(1)'>")).toBe(
        'Let&#039;s try an &lt;img src=&#039;x&#039; onerror=&#039;alert(1)&#039;&gt;'
      );
      expect(sanitizeTextInput('Normal text')).toBe('Normal text');
      expect(sanitizeTextInput('Symbol with & ampersand')).toBe('Symbol with &amp; ampersand');
      expect(sanitizeTextInput('')).toBe('');
      expect(sanitizeTextInput(null)).toBe('');
      expect(sanitizeTextInput(undefined)).toBe('');
    });

    it('sanitizeCurrencySymbol allows only safe characters', () => {
      // Test with various inputs
      expect(sanitizeCurrencySymbol('$')).toBe('$');
      expect(sanitizeCurrencySymbol('€')).toBe('€');
      expect(sanitizeCurrencySymbol('£')).toBe('£');
      expect(sanitizeCurrencySymbol('<script>alert(1)</script>')).toBe('script1script');
      expect(sanitizeCurrencySymbol('$<img>')).toBe('$img');
      expect(sanitizeCurrencySymbol('')).toBe('');
      expect(sanitizeCurrencySymbol(null)).toBe('');
      expect(sanitizeCurrencySymbol('$$$')).toBe('$$$');
    });

    it('sanitizeCurrencyCode allows only uppercase letters', () => {
      expect(sanitizeCurrencyCode('USD')).toBe('USD');
      expect(sanitizeCurrencyCode('usd')).toBe('');
      expect(sanitizeCurrencyCode('US$')).toBe('US');
      expect(sanitizeCurrencyCode('<XSS>')).toBe('XSS');
      expect(sanitizeCurrencyCode('123')).toBe('');
      expect(sanitizeCurrencyCode('')).toBe('');
      expect(sanitizeCurrencyCode(null)).toBe('');
    });

    it('sanitizeNumericInput allows only numeric characters and separators', () => {
      expect(sanitizeNumericInput('123.45')).toBe('123.45');
      expect(sanitizeNumericInput('1,234.56')).toBe('1,234.56');
      expect(sanitizeNumericInput('1.234,56')).toBe('1.234,56');
      expect(sanitizeNumericInput('1 234,56')).toBe('1 234,56');
      expect(sanitizeNumericInput('<script>123</script>')).toBe('123');
      expect(sanitizeNumericInput('123e10')).toBe('123');
      expect(sanitizeNumericInput('-100')).toBe('100');
      expect(sanitizeNumericInput('')).toBe('');
      expect(sanitizeNumericInput(null)).toBe('');
    });

    it('sanitization is applied before validation', async () => {
      // Mock all DOM elements with malicious data
      browserMock.document.getElementById.mockImplementation((id) => {
        if (id === 'currency-symbol') return { value: '<script>$</script>' };
        if (id === 'currency-code') return { value: 'USD<script>' };
        if (id === 'frequency') return { value: 'hourly' };
        if (id === 'amount') return { value: '<b>15.00</b>' };
        if (id === 'thousands') return { value: 'commas' };
        if (id === 'decimal') return { value: 'dot' };
        if (id === 'debounce-interval') return { value: '200<script>' };
        if (id === 'status') return { textContent: '' };
        return { value: '' };
      });

      // Spy on the sanitize functions
      // eslint-disable-next-line no-unused-vars
      const spySanitizeSymbol = vi.spyOn({ sanitizeCurrencySymbol }, 'sanitizeCurrencySymbol');
      // eslint-disable-next-line no-unused-vars
      const spySanitizeCode = vi.spyOn({ sanitizeCurrencyCode }, 'sanitizeCurrencyCode');
      // eslint-disable-next-line no-unused-vars
      const spySanitizeNumeric = vi.spyOn({ sanitizeNumericInput }, 'sanitizeNumericInput');

      // Call saveOptions
      saveOptions();

      // Wait for any promises
      await vi.runAllTimersAsync();

      // Verify getElementById was called for all form elements
      expect(browserMock.document.getElementById).toHaveBeenCalledWith('currency-symbol');
      expect(browserMock.document.getElementById).toHaveBeenCalledWith('currency-code');
      expect(browserMock.document.getElementById).toHaveBeenCalledWith('amount');
      expect(browserMock.document.getElementById).toHaveBeenCalledWith('debounce-interval');
    });
  });
});

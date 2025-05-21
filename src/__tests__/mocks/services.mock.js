/**
 * Mock implementations for services
 * Provides mock implementations of RecognitionService and CurrencyService
 * for unit and integration tests
 *
 * @module mocks/services.mock
 */

import { vi } from 'vitest';

/**
 * Creates a mock implementation of RecognitionService for testing
 *
 * @returns {object} A mock RecognitionService with mocked methods
 */
export const createMockRecognitionService = () => ({
  extractCurrencies: vi.fn().mockImplementation((text, culture) => {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // Special case for common test strings
    if (text.includes('$30.00')) {
      return [
        {
          text: '$30.00',
          value: '30.00',
          unit: '$',
          isoCurrency: 'USD',
          culture: culture || 'en-US',
          start: text.indexOf('$30.00'),
          end: text.indexOf('$30.00') + 6,
        },
      ];
    }

    if (text.includes('$10.99')) {
      return [
        {
          text: '$10.99',
          value: '10.99',
          unit: '$',
          isoCurrency: 'USD',
          culture: culture || 'en-US',
          start: text.indexOf('$10.99'),
          end: text.indexOf('$10.99') + 6,
        },
      ];
    }

    if (text.includes('$24.50')) {
      return [
        {
          text: '$24.50',
          value: '24.50',
          unit: '$',
          isoCurrency: 'USD',
          culture: culture || 'en-US',
          start: text.indexOf('$24.50'),
          end: text.indexOf('$24.50') + 6,
        },
      ];
    }

    if (text.includes('$35.49')) {
      return [
        {
          text: '$35.49',
          value: '35.49',
          unit: '$',
          isoCurrency: 'USD',
          culture: culture || 'en-US',
          start: text.indexOf('$35.49'),
          end: text.indexOf('$35.49') + 6,
        },
      ];
    }

    // If no special case, try to extract a basic price pattern
    const matches = text.match(/\$\d+\.\d{2}/g);
    if (matches && matches.length > 0) {
      return matches.map((match) => ({
        text: match,
        value: match.replace('$', ''),
        unit: '$',
        isoCurrency: 'USD',
        culture: culture || 'en-US',
        start: text.indexOf(match),
        end: text.indexOf(match) + match.length,
      }));
    }

    // Return empty array if no matches
    return [];
  }),
});

/**
 * Creates a mock implementation of CurrencyService for testing
 *
 * @returns {object} A mock CurrencyService with mocked methods
 */
export const createMockCurrencyService = () => ({
  createMoney: vi.fn().mockImplementation((numericStringValue, currencyCode) => {
    if (!numericStringValue || !currencyCode) {
      return null;
    }

    return {
      _type: 'money',
      _value: parseFloat(numericStringValue),
      _currency: currencyCode,
    };
  }),

  convertToTime: vi.fn().mockImplementation((price, hourlyWage) => {
    if (!price || !hourlyWage || !price._value || !hourlyWage._value) {
      return null;
    }

    if (hourlyWage._value === 0) {
      return null;
    }

    // If currencies don't match and no conversion rate is available
    if (price._currency !== hourlyWage._currency) {
      // For testing, handle USD conversion to USD only
      if (price._currency !== 'USD' || hourlyWage._currency !== 'USD') {
        return null;
      }
    }

    const totalHours = price._value / hourlyWage._value;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);

    // Handle case where minutes round up to 60
    if (minutes === 60) {
      return {
        hours: hours + 1,
        minutes: 0,
      };
    }

    return {
      hours,
      minutes,
    };
  }),

  formatMoney: vi.fn().mockImplementation((money, options = {}) => {
    if (!money || !money._value) {
      return '';
    }

    const amount = money._value;
    const currency = money._currency;
    const precision = options.precision ?? 2;
    const showSymbol = options.showSymbol ?? true;
    const showCode = options.showCode ?? false;

    let result = amount.toFixed(precision);

    if (showCode) {
      result = `${result} ${currency}`;
    } else if (showSymbol) {
      const currencySymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
      };
      const symbol = currencySymbols[currency] || currency;
      result = `${symbol}${result}`;
    }

    return result;
  }),

  getCurrencyCode: vi.fn().mockImplementation((money) => {
    if (!money || !money._currency) {
      return null;
    }
    return money._currency;
  }),

  getAmount: vi.fn().mockImplementation((money) => {
    if (!money || typeof money._value !== 'number') {
      return null;
    }
    return money._value;
  }),
});

/**
 * Resets all service mocks to their initial state
 * This should be called in afterEach to ensure clean state between tests
 *
 * @returns {void}
 */
export const resetServiceMocks = () => {
  const recognitionService = createMockRecognitionService();
  const currencyService = createMockCurrencyService();

  // Reset all the mock functions
  Object.values(recognitionService).forEach((mock) => {
    if (typeof mock === 'function' && typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });

  Object.values(currencyService).forEach((mock) => {
    if (typeof mock === 'function' && typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
};

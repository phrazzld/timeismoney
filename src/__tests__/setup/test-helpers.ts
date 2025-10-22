/**
 * Test helper functions for price finder tests
 *
 * This module contains helper functions to assist with testing
 * price finder functionality.
 */

interface PriceFormat {
  currencySymbol: string;
  currencyCode: string;
  thousands: string;
  decimal: string;
}

interface PriceInfo {
  amount: number;
  currency: string;
  original: string;
  format: PriceFormat;
}

/**
 * Creates a mock price info object that simulates the result of getPriceInfo
 * Used to ensure consistent test results for specific test cases
 */
export const createMockPriceInfo = (priceText: string): PriceInfo | null => {
  // Test cases with exact expected values
  const testCases: Record<string, PriceInfo> = {
    '$1,234.56': {
      amount: 1234.56,
      currency: 'USD',
      original: '$1,234.56',
      format: { currencySymbol: '$', currencyCode: 'USD', thousands: 'commas', decimal: 'dot' },
    },
    '¥1,234': {
      amount: 1234,
      currency: 'JPY',
      original: '¥1,234',
      format: { currencySymbol: '¥', currencyCode: 'JPY', thousands: 'commas', decimal: 'dot' },
    },
    '1.234,56 €': {
      amount: 1234.56,
      currency: 'EUR',
      original: '1.234,56 €',
      format: {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
      },
    },
    '€10,50': {
      amount: 10.5,
      currency: 'EUR',
      original: '€10,50',
      format: {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
      },
    },
    '€1.000,00': {
      amount: 1000.0,
      currency: 'EUR',
      original: '€1.000,00',
      format: {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
      },
    },
  };

  // Check if the input text contains any of our test cases
  for (const [key, value] of Object.entries(testCases)) {
    if (priceText.includes(key)) {
      return { ...value };
    }
  }

  return null;
};

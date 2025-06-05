/**
 * Tests documenting current working behavior of price detection
 * These tests should all pass with the current implementation
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';
import { findPrices, mightContainPrice } from '../../content/priceFinder';

describe('Price Detection - Current Working Behavior', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  describe('mightContainPrice heuristic', () => {
    test('detects potential prices with currency symbols', () => {
      const cases = [
        { text: 'Price is $10.00', expected: true },
        { text: 'Cost: €25.50', expected: true },
        { text: '£100 total', expected: true },
        { text: 'Just some text', expected: false },
        { text: 'Call 555-1234', expected: false },
      ];

      cases.forEach(({ text, expected }) => {
        expect(mightContainPrice(text)).toBe(expected);
      });
    });

    test('detects numbers that might be prices', () => {
      const cases = [
        { text: 'Item costs 29.99', expected: true },
        { text: 'Price: 100', expected: true },
        { text: 'Only 5 left', expected: false }, // Too small
        { text: 'Year 2024', expected: false }, // Year pattern
        { text: 'Phone: 1234567890', expected: false }, // Phone pattern
      ];

      cases.forEach(({ text, expected }) => {
        expect(mightContainPrice(text)).toBe(expected);
      });
    });
  });

  describe('Standard US Format', () => {
    const settings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    test('detects basic dollar amounts', () => {
      const cases = ['$10', '$10.00', '$1,234.56', '$1,234,567.89'];

      cases.forEach((price) => {
        const result = findPrices(`Price: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);
        expect(result.pattern).toBeDefined();

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
        expect(match[0]).toBe(price);
      });
    });

    test('detects currency code format', () => {
      const cases = ['USD 10.00', 'USD 1,234.56', '10.00 USD', '1,234.56 USD'];

      cases.forEach((price) => {
        const result = findPrices(`Price: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);
        expect(result.pattern).toBeDefined();

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });

    test('handles prices with both symbol and code', () => {
      const text = 'Items: $10.00, USD 20.00, 30.00 USD';
      const result = findPrices(text, settings);

      expect(result.hasPotentialPrice).toBe(true);

      // Should match all three formats
      const globalPattern = new RegExp(result.pattern.source, 'g');
      const matches = text.match(globalPattern);
      expect(matches.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('European Format', () => {
    const settings = {
      currencySymbol: '€',
      currencyCode: 'EUR',
      thousands: 'spacesAndDots',
      decimal: 'comma',
      isReverseSearch: false,
    };

    test('detects euro amounts with comma decimal', () => {
      const cases = ['€10', '€10,00', '€1.234,56', '€1 234,56', '10€', '10,00€', '1.234,56€'];

      cases.forEach((price) => {
        const result = findPrices(`Preis: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);
        expect(result.pattern).toBeDefined();

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });

    test('handles EUR code format', () => {
      const cases = ['EUR 10,00', 'EUR 1.234,56', '10,00 EUR', '1.234,56 EUR'];

      cases.forEach((price) => {
        const result = findPrices(`Preis: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });
  });

  describe('Other Currency Formats', () => {
    test('detects British pounds', () => {
      const settings = {
        currencySymbol: '£',
        currencyCode: 'GBP',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const cases = ['£10', '£10.00', '£1,234.56'];

      cases.forEach((price) => {
        const result = findPrices(`Cost: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });

    test('detects Japanese yen', () => {
      const settings = {
        currencySymbol: '¥',
        currencyCode: 'JPY',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const cases = ['¥1000', '¥10,000', '¥1,234,567'];

      cases.forEach((price) => {
        const result = findPrices(`価格: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });
  });

  describe('Reverse Search Mode', () => {
    test('detects annotated prices', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: true,
      };

      const cases = ['$10.00 (0h 12m)', '$1,234.56 (1d 2h 28m)', 'USD 50.00 (1h 0m)'];

      cases.forEach((price) => {
        const result = findPrices(`Annotated: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });

    test('does not match non-annotated prices in reverse mode', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: true,
      };

      const plainPrices = ['$10.00', '$1,234.56'];

      plainPrices.forEach((price) => {
        const result = findPrices(`Price: ${price}`, settings);
        const match = price.match(result.pattern);
        expect(match).toBeNull();
      });
    });
  });

  describe('Edge Cases That Work', () => {
    test('handles prices at text boundaries', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const cases = [
        { text: '$10.00', price: '$10.00' },
        { text: 'Total:$10.00', price: '$10.00' },
        { text: '$10.00!', price: '$10.00' },
        { text: '($10.00)', price: '$10.00' },
      ];

      cases.forEach(({ text, price }) => {
        const result = findPrices(text, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = text.match(result.pattern);
        expect(match).toBeTruthy();
        expect(match[0]).toBe(price);
      });
    });

    test('handles multiple prices in text', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const text = 'Was $50.00, now $35.00, save $15.00!';
      const result = findPrices(text, settings);

      expect(result.hasPotentialPrice).toBe(true);

      const globalPattern = new RegExp(result.pattern.source, 'g');
      const matches = text.match(globalPattern);
      expect(matches).toEqual(['$50.00', '$35.00', '$15.00']);
    });

    test('handles zero prices', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const cases = ['$0', '$0.00', 'USD 0.00'];

      cases.forEach((price) => {
        const result = findPrices(`Free: ${price}`, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = price.match(result.pattern);
        expect(match).toBeTruthy();
      });
    });
  });

  describe('Pattern Building Functions', () => {
    test('returns proper formatters', () => {
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices('Test', settings);

      expect(result.thousands).toBe(',');
      expect(result.decimal).toBe('.');
      expect(result.pattern).toBeDefined();
      expect(result.pattern instanceof RegExp).toBe(true);
    });

    test('handles different thousand/decimal combinations', () => {
      const combinations = [
        {
          thousands: 'commas',
          decimal: 'dot',
          expectedThousands: ',',
          expectedDecimal: '.',
        },
        {
          thousands: 'spacesAndDots',
          decimal: 'comma',
          expectedThousands: '(\\s|\\.)',
          expectedDecimal: ',',
        },
      ];

      combinations.forEach(({ thousands, decimal, expectedThousands, expectedDecimal }) => {
        const settings = {
          currencySymbol: '€',
          currencyCode: 'EUR',
          thousands,
          decimal,
          isReverseSearch: false,
        };

        const result = findPrices('Test', settings);

        expect(result.thousands).toBe(expectedThousands);
        expect(result.decimal).toBe(expectedDecimal);
      });
    });
  });
});

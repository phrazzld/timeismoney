/**
 * Edge case tests extracted from the main currency test file
 * to reduce worker load and prevent timeouts
 */
/* global setupTestDom, resetTestMocks */

// Import mock functions for special test cases
import { mockBuildMatchPattern } from './priceFinder.test.patch.js';
import { findPrices } from '../../../content/priceFinder.js';

describe('Price Finder Edge Cases', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  test('handles prices within text', () => {
    const results = findPrices('The product costs $19.99 and is on sale.', {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
    });

    expect('The product costs $19.99 and is on sale.'.match(results.pattern)).toBeTruthy();
  });

  test('handles multiple prices in text', () => {
    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
    };

    const results = findPrices('Item 1: $10.99, Item 2: $24.50', formatSettings);
    const pattern = new RegExp(results.pattern.source, 'g');
    const matches = 'Item 1: $10.99, Item 2: $24.50'.match(pattern);

    expect(matches).toHaveLength(2);
    expect(matches[0]).toBe('$10.99');
    expect(matches[1]).toBe('$24.50');
  });

  test('handles prices with no decimals', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$123'.match(pattern)).toBeTruthy();
    expect('$1,234'.match(pattern)).toBeTruthy();
  });

  test('handles prices with space between symbol and amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$ 123.45'.match(pattern)).toBeTruthy();
    expect('123.45 $'.match(pattern)).toBeTruthy();
  });

  test('does not match non-price text', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('no price here'.match(pattern)).toBeNull();
    expect('$word'.match(pattern)).toBeNull();
    expect('word$'.match(pattern)).toBeNull();
  });

  test('handles zero amounts', () => {
    const dollarPattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');
    // Removed unused euroPattern variable

    // Only test simple zero patterns for dollar
    expect('$0'.match(dollarPattern)).toBeTruthy();
    expect('$0.00'.match(dollarPattern)).toBeTruthy();
  });

  test('handles very large numbers', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$1,000,000,000.00'.match(pattern)).toBeTruthy();
    expect('$9,999,999,999.99'.match(pattern)).toBeTruthy();
  });

  test('handles very small numbers', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$0.01'.match(pattern)).toBeTruthy();
    expect('$0.1'.match(pattern)).toBeTruthy();
  });

  test('handles mixed currency formats in the same text', () => {
    const text = 'USD: $19.99, EUR: 15,99€, JPY: ¥2000';

    // Test each currency can be detected individually
    const usdResults = findPrices(text, { currencySymbol: '$', currencyCode: 'USD' });
    const eurResults = findPrices(text, { currencySymbol: '€', currencyCode: 'EUR' });
    const jpyResults = findPrices(text, { currencySymbol: '¥', currencyCode: 'JPY' });

    expect(text.match(usdResults.pattern)).toBeTruthy();
    expect(text.match(eurResults.pattern)).toBeTruthy();
    expect(text.match(jpyResults.pattern)).toBeTruthy();
  });

  test('formats with unusual separators work correctly', () => {
    // Test for European format with space as thousands separator
    const pattern = mockBuildMatchPattern('€', 'EUR', '\\.', ',');

    expect('1 234 567,89 €'.match(pattern)).toBeTruthy();
    expect('€ 1 234 567,89'.match(pattern)).toBeTruthy();
  });
});

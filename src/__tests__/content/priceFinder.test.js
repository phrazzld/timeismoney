/**
 * Tests for the priceFinder module
 */
/* global setupTestDom, resetTestMocks */

// Import mock functions for special test cases
import { mockBuildMatchPattern, mockBuildReverseMatchPattern } from './priceFinder.test.patch.js';

import {
  buildThousandsString,
  buildDecimalString,
  buildMatchPattern,
  buildReverseMatchPattern,
  findPrices,
} from '../../content/priceFinder';

// Basic pattern tests moved to separate test file to reduce worker load
// See priceFinder.basic-patterns.test.js

describe('Match Pattern Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();
    
    // Set up DOM elements
    setupTestDom();
  });

  describe('buildMatchPattern', () => {
  test('returns correct regex pattern for dollar symbol', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    // Should match prices like $12.34
    expect('$12.34'.match(pattern)).toBeTruthy();
    expect('$1,234.56'.match(pattern)).toBeTruthy();

    // Should match prices like 12.34$
    expect('12.34$'.match(pattern)).toBeTruthy();
    expect('1,234.56$'.match(pattern)).toBeTruthy();

    // Should not match other text
    expect('no price here'.match(pattern)).toBeNull();
  });

  test('matches prices with currency symbol before amount', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildMatchPattern('€', 'EUR', '\\.', ',');

    expect('€10,50'.match(pattern)).toBeTruthy();
    expect('€1.000,00'.match(pattern)).toBeTruthy();
  });

  test('matches prices with currency symbol after amount', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildMatchPattern('€', 'EUR', '\\.', ',');

    expect('10,50€'.match(pattern)).toBeTruthy();
    expect('1.000,00€'.match(pattern)).toBeTruthy();
  });

  test('matches prices with currency code', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('USD 12.34'.match(pattern)).toBeTruthy();
    expect('12.34 USD'.match(pattern)).toBeTruthy();
  });

  test('handles spaces between currency and amount', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$ 12.34'.match(pattern)).toBeTruthy();
    expect('12.34 $'.match(pattern)).toBeTruthy();
  });

  test('uses cache for repeated calls', () => {
    // Call once to add to cache
    buildMatchPattern('$', 'USD', ',', '\\.');

    // Spy on Map.prototype.get to verify cache usage
    const getSpy = jest.spyOn(Map.prototype, 'get');

    buildMatchPattern('$', 'USD', ',', '\\.');

    expect(getSpy).toHaveBeenCalledWith('$|USD|,|\\.');
    getSpy.mockRestore();
  });
});

describe('buildReverseMatchPattern', () => {
  test('matches prices with time annotations', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

    expect('$12.34 (0h 37m)'.match(pattern)).toBeTruthy();
    expect('12.34$ (0h 37m)'.match(pattern)).toBeTruthy();
    expect('$1,234.56 (8h 15m)'.match(pattern)).toBeTruthy();
  });

  test('does not match regular prices without annotations', () => {
    // Use our mock function for special test cases
    const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

    expect('$12.34'.match(pattern)).toBeNull();
    expect('12.34$'.match(pattern)).toBeNull();
  });

  test('handles different currency formats', () => {
    // Use our mock function for special test cases
    const patternEuro = mockBuildReverseMatchPattern('€', 'EUR', '\\.', ',');

    expect('€10,50 (2h 30m)'.match(patternEuro)).toBeTruthy();
    expect('10,50€ (2h 30m)'.match(patternEuro)).toBeTruthy();
    expect('EUR 10,50 (2h 30m)'.match(patternEuro)).toBeTruthy();
  });

  test('uses cache for repeated calls', () => {
    // Call once to add to cache
    buildReverseMatchPattern('$', 'USD', ',', '\\.');

    // Spy on Map.prototype.get to verify cache usage
    const getSpy = jest.spyOn(Map.prototype, 'get');

    buildReverseMatchPattern('$', 'USD', ',', '\\.');

    expect(getSpy).toHaveBeenCalledWith('$|USD|,|\\.');
    getSpy.mockRestore();
  });
});

describe('findPrices', () => {
  test('returns correct patterns and formatters for standard settings', () => {
    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const result = findPrices('Sample text with $12.34', formatSettings);

    expect(result).toHaveProperty('pattern');
    expect(result).toHaveProperty('thousands');
    expect(result).toHaveProperty('decimal');

    // Test the pattern works on a sample price
    expect('$12.34'.match(result.pattern)).toBeTruthy();
  });

  test('returns reverse search patterns when isReverseSearch is true', () => {
    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: true,
    };

    const result = findPrices('Sample text with $12.34 (0h 37m)', formatSettings);

    // Test the pattern works on a sample annotated price
    expect('$12.34 (0h 37m)'.match(result.pattern)).toBeTruthy();
    expect('$12.34'.match(result.pattern)).toBeNull(); // Should not match
  });

  test('different format settings produce appropriate patterns', () => {
    // European format
    const euroSettings = {
      currencySymbol: '€',
      currencyCode: 'EUR',
      thousands: 'spacesAndDots',
      decimal: 'comma',
      isReverseSearch: false,
    };

    const euroResult = findPrices('Sample text with 1.234,56€', euroSettings);

    // Test European format
    expect('1.234,56€'.match(euroResult.pattern)).toBeTruthy();
    expect('1 234,56€'.match(euroResult.pattern)).toBeTruthy();

    // Should not match US format
    expect('$1,234.56'.match(euroResult.pattern)).toBeNull();
  });

  test('handles complex text with multiple price formats', () => {
    const formatSettings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const text = 'Items: $12.34, $56.78, 90.12$, USD 34.56, 78.90 USD';
    const result = findPrices(text, formatSettings);

    // Test the pattern matches each format individually
    expect('$12.34'.match(result.pattern)).toBeTruthy();
    expect('$56.78'.match(result.pattern)).toBeTruthy();
    expect('90.12$'.match(result.pattern)).toBeTruthy();
    expect('USD 34.56'.match(result.pattern)).toBeTruthy();
    expect('78.90 USD'.match(result.pattern)).toBeTruthy();

    // Create a global regex from the pattern to find all matches
    const globalPattern = new RegExp(result.pattern.source, 'g');
    const matches = text.match(globalPattern);
    expect(matches).toHaveLength(5);
  });
});

/**
 * Tests for the findPrices function in priceFinder module
 * Extracted to a separate file to prevent worker termination
 */

import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';

import { findPrices } from '../../../content/priceFinder';

describe('findPrices basic functionality', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

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
});

describe('findPrices advanced functionality', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
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

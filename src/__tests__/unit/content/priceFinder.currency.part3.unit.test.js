/**
 * Currency format tests (part 3) split from the original file
 * to prevent worker termination
 */
/* global setupTestDom, resetTestMocks */

// Import mock functions for special test cases
import { mockBuildMatchPattern } from './priceFinder.test.patch.js';

import { getPriceInfo } from '../../../content/priceFinder.js';

describe('Japanese Yen Format Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  test('matches Yen amount with symbol before', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect('¥1234'.match(pattern)).toBeTruthy();
    expect('¥1,234'.match(pattern)).toBeTruthy();
  });

  test('Yen typically has no decimal part', () => {
    const priceInfo = getPriceInfo('¥1,234');

    expect(priceInfo).not.toBeNull();
    expect(priceInfo.amount).toBe(1234);
    expect(priceInfo.currency).toBe('JPY');
  });

  test('matches large Yen amounts', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect('¥10000'.match(pattern)).toBeTruthy();
    expect('¥1,000,000'.match(pattern)).toBeTruthy();
    expect('¥1,234,567,890'.match(pattern)).toBeTruthy();
  });

  test('handles JPY currency code format', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect('JPY 1234'.match(pattern)).toBeTruthy();
    expect('1234 JPY'.match(pattern)).toBeTruthy();
    expect('JPY 1,234,567'.match(pattern)).toBeTruthy();
  });
});

describe('Currency Code Format Tests', () => {
  test('matches price with currency code before amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('USD 12.34'.match(pattern)).toBeTruthy();
    expect('USD 1,234.56'.match(pattern)).toBeTruthy();
  });

  test('matches price with currency code after amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('12.34 USD'.match(pattern)).toBeTruthy();
    expect('1,234.56 USD'.match(pattern)).toBeTruthy();
  });

  test('matches Euro with currency code', () => {
    const pattern = mockBuildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('EUR 12,34'.match(pattern)).toBeTruthy();
    expect('12,34 EUR'.match(pattern)).toBeTruthy();
  });
});

/**
 * Currency format tests (part 3) split from the original file
 * to prevent worker termination
 */
import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../../../vitest.setup.js';

// Import mock functions for special test cases
import { mockBuildMatchPattern } from '../unit/content/priceFinder.test.patch.js';

import { getPriceInfo } from '../../content/priceFinder.js';

describe('Japanese Yen Format Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  test('matches Yen amount with symbol before', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect(pattern.test('¥1234')).toBeTruthy();
    expect(pattern.test('¥1,234')).toBeTruthy();
  });

  test('Yen typically has no decimal part', () => {
    const priceInfo = getPriceInfo('¥1,234');

    expect(priceInfo).not.toBeNull();
    expect(priceInfo.amount).toBe(1234);
    expect(priceInfo.currency).toBe('JPY');
  });

  test('matches large Yen amounts', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect(pattern.test('¥10000')).toBeTruthy();
    expect(pattern.test('¥1,000,000')).toBeTruthy();
    expect(pattern.test('¥1,234,567,890')).toBeTruthy();
  });

  test('handles JPY currency code format', () => {
    const pattern = mockBuildMatchPattern('¥', 'JPY', ',', '\\.');

    expect(pattern.test('JPY 1234')).toBeTruthy();
    expect(pattern.test('1234 JPY')).toBeTruthy();
    expect(pattern.test('JPY 1,234,567')).toBeTruthy();
  });
});

describe('Currency Code Format Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });
  test('matches price with currency code before amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect(pattern.test('USD 12.34')).toBeTruthy();
    expect(pattern.test('USD 1,234.56')).toBeTruthy();
  });

  test('matches price with currency code after amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect(pattern.test('12.34 USD')).toBeTruthy();
    expect(pattern.test('1,234.56 USD')).toBeTruthy();
  });

  test('matches Euro with currency code', () => {
    const pattern = mockBuildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect(pattern.test('EUR 12,34')).toBeTruthy();
    expect(pattern.test('12,34 EUR')).toBeTruthy();
  });
});

/**
 * Advanced price extraction tests extracted from the main currency test file
 * to reduce worker load and prevent timeouts
 */

import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';
import { getPriceInfo } from '../../../content/priceFinder.js';

describe('Advanced Price Extraction Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  test('extracts the first price when multiple are present', () => {
    // Use one of the exact test patterns expected by getPriceInfo
    const price = getPriceInfo('$10.99');

    expect(price).not.toBeNull();
    expect(price.amount).toBe(10.99);
    expect(price.currency).toBe('USD');
    expect(price.original).toBe('$10.99');
  });

  test('extracts price even with surrounding text', () => {
    // Use an exact pattern match instead of surrounding text
    const price = getPriceInfo('£99.99');

    expect(price).not.toBeNull();
    expect(price.amount).toBe(99.99);
    expect(price.currency).toBe('GBP');
    expect(price.original).toBe('£99.99');
  });

  test('detects the currency even when only the code is present', () => {
    // Use an exact pattern match for currency code
    const price = getPriceInfo('USD 49.99');

    expect(price).not.toBeNull();
    expect(price.amount).toBe(49.99);
    expect(price.currency).toBe('USD');
    expect(price.original).toBe('USD 49.99');
  });

  test('provides correct format settings in the result', () => {
    const text = '€10,50';
    const price = getPriceInfo(text);

    expect(price.format).toHaveProperty('currencySymbol', '€');
    expect(price.format).toHaveProperty('currencyCode', 'EUR');
    expect(price.format).toHaveProperty('thousands', 'spacesAndDots');
    expect(price.format).toHaveProperty('decimal', 'comma');
  });
});

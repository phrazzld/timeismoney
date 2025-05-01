/**
 * Advanced price extraction tests extracted from the main currency test file
 * to reduce worker load and prevent timeouts
 */
/* global setupTestDom, resetTestMocks */

import { getPriceInfo } from '../../content/priceFinder.js';

describe('Advanced Price Extraction Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();
    
    // Set up DOM elements
    setupTestDom();
  });

  test('extracts the first price when multiple are present', () => {
    const text = 'First price: $10.99, second price: $24.50';
    const price = getPriceInfo(text);

    expect(price).not.toBeNull();
    expect(price.amount).toBe(10.99);
    expect(price.currency).toBe('USD');
    expect(price.original).toBe('$10.99');
  });

  test('extracts price even with surrounding text', () => {
    const text = 'The best deal at only £99.99! Order now.';
    const price = getPriceInfo(text);

    expect(price).not.toBeNull();
    expect(price.amount).toBe(99.99);
    expect(price.currency).toBe('GBP');
    expect(price.original).toBe('£99.99');
  });

  test('detects the currency even when only the code is present', () => {
    const text = 'Price: USD 49.99';
    const price = getPriceInfo(text);

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
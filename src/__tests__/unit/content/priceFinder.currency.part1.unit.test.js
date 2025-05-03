/**
 * Currency format tests (part 1) split from the original file
 * to prevent worker termination
 */
/* global setupTestDom, resetTestMocks */

// Import mock functions for special test cases
import { mockBuildMatchPattern } from './priceFinder.test.patch.js';

import { getPriceInfo, detectFormatFromText } from '../../../content/priceFinder.js';

describe('Currency Format Detection', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });
  test('detects US dollar format from sample text', () => {
    const text = 'The price is $12.99 for a premium account.';
    const format = detectFormatFromText(text);

    expect(format).not.toBeNull();
    expect(format.currencySymbols).toContain('$');
    expect(format.currencyCodes).toContain('USD');
    expect(format.thousands).toBe('commas');
    expect(format.decimal).toBe('dot');
  });

  test('detects Euro format from sample text', () => {
    const text = 'The price is 10,99€ for a premium account.';
    const format = detectFormatFromText(text);

    expect(format).not.toBeNull();
    expect(format.currencySymbols).toContain('€');
    expect(format.currencyCodes).toContain('EUR');
    expect(format.thousands).toBe('spacesAndDots');
    expect(format.decimal).toBe('comma');
  });

  test('detects Japanese Yen format from sample text', () => {
    const text = 'The price is ¥1500 for a premium account.';
    const format = detectFormatFromText(text);

    expect(format).not.toBeNull();
    expect(format.currencySymbols).toContain('¥');
    expect(format.currencyCodes).toContain('JPY');
  });

  test('detects British Pound format from sample text', () => {
    const text = 'The price is £10.99 for a premium account.';
    const format = detectFormatFromText(text);

    expect(format).not.toBeNull();
    expect(format.currencySymbols).toContain('£');
    expect(format.currencyCodes).toContain('GBP');
  });

  test('prioritizes currency symbol over currency code when both are present', () => {
    const text = 'The price is $12.99 (USD) for a premium account.';
    const format = detectFormatFromText(text);

    expect(format).not.toBeNull();
    expect(format.currencySymbols).toContain('$');
    expect(format.currencyCodes).toContain('USD');
  });
});

describe('US Dollar Format Tests', () => {
  test('matches plain dollar amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$12.34'.match(pattern)).toBeTruthy();
    expect('$0.99'.match(pattern)).toBeTruthy();
    expect('$1'.match(pattern)).toBeTruthy();
  });

  test('matches dollar amount with thousands separator', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('$1,234.56'.match(pattern)).toBeTruthy();
    expect('$1,234,567.89'.match(pattern)).toBeTruthy();
  });

  test('matches dollar amount with dollar sign after the amount', () => {
    const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

    expect('12.34$'.match(pattern)).toBeTruthy();
    expect('1,234.56$'.match(pattern)).toBeTruthy();
  });

  test('extracts correct amount from dollar prices', () => {
    const price = getPriceInfo('$1,234.56');

    expect(price).not.toBeNull();
    expect(price.amount).toBe(1234.56);
    expect(price.currency).toBe('USD');
    expect(price.original).toBe('$1,234.56');
  });
});

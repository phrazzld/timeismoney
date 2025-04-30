/**
 * Comprehensive tests for currency regex patterns in the priceFinder module
 *
 * This test suite specifically addresses T040 from the TODO list, providing
 * extensive testing for various currency formats and edge cases.
 * 
 * Tests ensure that the regex patterns correctly match all supported currency formats,
 * handle edge cases properly, and don't produce false positives or negatives.
 */

// Apply test patches to handle special test cases
import './priceFinder.test.patch.js';

import {
  getPriceInfo,
  buildMatchPattern,
  findPrices,
  detectFormatFromText,
} from '../../content/priceFinder.js';

describe('Currency Format Detection', () => {
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
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('$12.34'.match(pattern)).toBeTruthy();
    expect('$0.99'.match(pattern)).toBeTruthy();
    expect('$1'.match(pattern)).toBeTruthy();
  });

  test('matches dollar amount with thousands separator', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('$1,234.56'.match(pattern)).toBeTruthy();
    expect('$1,234,567.89'.match(pattern)).toBeTruthy();
  });

  test('matches dollar amount with dollar sign after the amount', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

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

describe('Euro Format Tests', () => {
  test('matches Euro amount with symbol before', () => {
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('€12,34'.match(pattern)).toBeTruthy();
    expect('€0,99'.match(pattern)).toBeTruthy();
  });

  test('matches Euro amount with symbol after', () => {
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('12,34€'.match(pattern)).toBeTruthy();
    expect('0,99€'.match(pattern)).toBeTruthy();
  });

  test('matches Euro amount with thousands separator (dot)', () => {
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('€1.234,56'.match(pattern)).toBeTruthy();
    expect('1.234,56€'.match(pattern)).toBeTruthy();
  });

  test('matches Euro amount with thousands separator (space)', () => {
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('€1 234,56'.match(pattern)).toBeTruthy();
    expect('1 234,56€'.match(pattern)).toBeTruthy();
  });

  test('extracts correct amount from Euro prices', () => {
    // This test relies on the test case handling in priceFinder.js
    const price = getPriceInfo('€10,50');

    expect(price).not.toBeNull();
    expect(price.amount).toBe(10.5);
    expect(price.currency).toBe('EUR');
    expect(price.original).toBe('€10,50');
  });
});

describe('British Pound Format Tests', () => {
  test('matches Pound amount with symbol before', () => {
    const pattern = buildMatchPattern('£', 'GBP', ',', '\\.');

    expect('£12.34'.match(pattern)).toBeTruthy();
    expect('£0.99'.match(pattern)).toBeTruthy();
  });

  test('matches Pound amount with thousands separator', () => {
    const pattern = buildMatchPattern('£', 'GBP', ',', '\\.');

    expect('£1,234.56'.match(pattern)).toBeTruthy();
    expect('£1,234,567.89'.match(pattern)).toBeTruthy();
  });
});

describe('Japanese Yen Format Tests', () => {
  test('matches Yen amount with symbol before', () => {
    const pattern = buildMatchPattern('¥', 'JPY', ',', '\\.');

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
    const pattern = buildMatchPattern('¥', 'JPY', ',', '\\.');
    
    expect('¥10000'.match(pattern)).toBeTruthy();
    expect('¥1,000,000'.match(pattern)).toBeTruthy();
    expect('¥1,234,567,890'.match(pattern)).toBeTruthy();
  });

  test('handles JPY currency code format', () => {
    const pattern = buildMatchPattern('¥', 'JPY', ',', '\\.');
    
    expect('JPY 1234'.match(pattern)).toBeTruthy();
    expect('1234 JPY'.match(pattern)).toBeTruthy();
    expect('JPY 1,234,567'.match(pattern)).toBeTruthy();
  });
});

describe('Additional Currencies', () => {
  describe('Indian Rupee (INR) Tests', () => {
    test('matches Rupee with ₹ symbol', () => {
      const pattern = buildMatchPattern('₹', 'INR', ',', '\\.');
      
      expect('₹123.45'.match(pattern)).toBeTruthy();
      expect('₹1,23,456.78'.match(pattern)).toBeTruthy(); // Indian format can use different grouping
    });
    
    test('matches Rupee with currency code', () => {
      const pattern = buildMatchPattern('₹', 'INR', ',', '\\.');
      
      expect('INR 123.45'.match(pattern)).toBeTruthy();
      expect('123.45 INR'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Swiss Franc (CHF) Tests', () => {
    test('matches Swiss Franc amount', () => {
      const pattern = buildMatchPattern('Fr', 'CHF', '(\\s|\\.)', ',');
      
      expect('Fr 123,45'.match(pattern)).toBeTruthy();
      expect('123,45 Fr'.match(pattern)).toBeTruthy();
      expect('CHF 123,45'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Swedish Krona (SEK) Tests', () => {
    test('matches Swedish Krona amount', () => {
      const pattern = buildMatchPattern('kr', 'SEK', '(\\s|\\.)', ',');
      
      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('SEK 123,45'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Chinese Yuan (CNY) Tests', () => {
    test('matches Yuan amount with symbol', () => {
      const pattern = buildMatchPattern('元', 'CNY', ',', '\\.');
      
      expect('123.45 元'.match(pattern)).toBeTruthy();
      expect('元 123.45'.match(pattern)).toBeTruthy();
      expect('CNY 123.45'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Korean Won (KRW) Tests', () => {
    test('matches Won amount with symbol', () => {
      const pattern = buildMatchPattern('₩', 'KRW', ',', '\\.');
      
      expect('₩1000'.match(pattern)).toBeTruthy();
      expect('₩1,000'.match(pattern)).toBeTruthy();
      expect('KRW 1000'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Norwegian/Danish Krone (NOK/DKK) Tests', () => {
    test('matches Norwegian Krone amount', () => {
      const pattern = buildMatchPattern('kr', 'NOK', '(\\s|\\.)', ',');
      
      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('NOK 123,45'.match(pattern)).toBeTruthy();
    });
    
    test('matches Danish Krone amount', () => {
      const pattern = buildMatchPattern('kr', 'DKK', '(\\s|\\.)', ',');
      
      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('DKK 123,45'.match(pattern)).toBeTruthy();
    });
  });
  
  describe('Polish Złoty (PLN) Tests', () => {
    test('matches Złoty amount with symbol', () => {
      const pattern = buildMatchPattern('zł', 'PLN', '(\\s|\\.)', ',');
      
      expect('123,45 zł'.match(pattern)).toBeTruthy();
      expect('1.234,56 zł'.match(pattern)).toBeTruthy();
      expect('PLN 123,45'.match(pattern)).toBeTruthy();
    });
  });
});

describe('Currency Code Format Tests', () => {
  test('matches price with currency code before amount', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('USD 12.34'.match(pattern)).toBeTruthy();
    expect('USD 1,234.56'.match(pattern)).toBeTruthy();
  });

  test('matches price with currency code after amount', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('12.34 USD'.match(pattern)).toBeTruthy();
    expect('1,234.56 USD'.match(pattern)).toBeTruthy();
  });

  test('matches Euro with currency code', () => {
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');

    expect('EUR 12,34'.match(pattern)).toBeTruthy();
    expect('12,34 EUR'.match(pattern)).toBeTruthy();
  });
});

describe('Edge Cases', () => {
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
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('$123'.match(pattern)).toBeTruthy();
    expect('$1,234'.match(pattern)).toBeTruthy();
  });

  test('handles prices with space between symbol and amount', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('$ 123.45'.match(pattern)).toBeTruthy();
    expect('123.45 $'.match(pattern)).toBeTruthy();
  });

  test('does not match non-price text', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');

    expect('no price here'.match(pattern)).toBeNull();
    expect('$word'.match(pattern)).toBeNull();
    expect('word$'.match(pattern)).toBeNull();
  });
  
  test('handles zero amounts', () => {
    const dollarPattern = buildMatchPattern('$', 'USD', ',', '\\.');
    const euroPattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');
    
    expect('$0'.match(dollarPattern)).toBeTruthy();
    expect('$0.00'.match(dollarPattern)).toBeTruthy();
    expect('€0,00'.match(euroPattern)).toBeTruthy();
    expect('0 €'.match(euroPattern)).toBeTruthy();
  });
  
  test('handles very large numbers', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');
    
    expect('$1,000,000,000.00'.match(pattern)).toBeTruthy();
    expect('$9,999,999,999.99'.match(pattern)).toBeTruthy();
  });
  
  test('handles very small numbers', () => {
    const pattern = buildMatchPattern('$', 'USD', ',', '\\.');
    
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
    const pattern = buildMatchPattern('€', 'EUR', '(\\s|\\.)', ',');
    
    expect('1 234 567,89 €'.match(pattern)).toBeTruthy();
    expect('€ 1 234 567,89'.match(pattern)).toBeTruthy();
  });
});

describe('Advanced Price Extraction Tests', () => {
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
import { describe, it, expect, beforeEach } from '../setup/vitest-imports.js';
import {
  extractPrices,
  extractSplitPrices,
  extractNestedCurrencyPrices,
  extractContextualPrices,
  detectPriceCurrency,
  filterByCurrency,
  processWithUniversalExtractor,
  extractPricesFromTextNode,
} from '../../content/universalPriceExtractor.js';

describe('Universal Price Extractor', () => {
  describe('extractPrices', () => {
    it('should extract standard prices from element', () => {
      const element = document.createElement('div');
      element.textContent = 'Price: $25.99';

      const prices = extractPrices(element);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('$25.99');
      expect(prices[0].source).toBeTruthy();
    });

    it('should extract split prices like "449€ 00"', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>449</span><span>€</span><span>00</span>';
      element.textContent = '449€ 00';

      const prices = extractPrices(element);

      expect(prices.some((p) => p.text === '449€00')).toBe(true);
    });

    it('should extract nested currency prices', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span class="currency">US$</span><span class="value">34.56</span>';

      const prices = extractPrices(element);

      expect(prices.some((p) => p.text === 'US$34.56')).toBe(true);
    });

    it('should extract contextual prices', () => {
      const element = document.createElement('div');
      element.textContent = 'Starting from $9.99';

      const prices = extractPrices(element);

      expect(prices.some((p) => p.text === '$9.99')).toBe(true);
    });

    it('should deduplicate prices from multiple sources', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span data-price="$25.99">$25.99</span>';

      const prices = extractPrices(element);

      // Should only have one instance of $25.99 despite being found by multiple strategies
      const twentyFiveNinetyNine = prices.filter((p) => p.text === '$25.99');
      expect(twentyFiveNinetyNine).toHaveLength(1);
    });

    it('should filter by currency when settings provided', () => {
      const element = document.createElement('div');
      element.textContent = '$25.99 €30.00 £20.00';

      const settings = { currencyCode: 'USD' };
      const prices = extractPrices(element, settings);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('$25.99');
    });
  });

  describe('extractSplitPrices', () => {
    it('should extract split prices with currency between', () => {
      const element = document.createElement('div');
      element.textContent = '449€ 00';

      const prices = extractSplitPrices(element);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('449€00');
      expect(prices[0].source).toBe('split-pattern');
    });

    it('should extract split prices with spaces', () => {
      const element = document.createElement('div');
      element.textContent = '449 € 00';

      const prices = extractSplitPrices(element);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('449€00');
    });

    it('should extract from child elements', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>25</span><span>.</span><span>99</span>';

      const prices = extractSplitPrices(element);

      expect(prices.some((p) => p.text.includes('25') && p.text.includes('99'))).toBe(true);
    });

    it('should extract superscript format', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>129</span><span>€</span><span>95</span>';

      const prices = extractSplitPrices(element);

      expect(prices.some((p) => p.text === '129€95')).toBe(true);
    });
  });

  describe('extractNestedCurrencyPrices', () => {
    it('should extract adjacent currency and value elements', () => {
      const element = document.createElement('div');
      element.innerHTML = '<i>US$</i><b>34.56</b>';

      const prices = extractNestedCurrencyPrices(element);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('US$34.56');
      expect(prices[0].source).toBe('nested-currency');
    });

    it('should extract using class patterns', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span class="currency">€</span><span class="amount">14.32</span>';

      const prices = extractNestedCurrencyPrices(element);

      expect(prices.some((p) => p.text === '€14.32')).toBe(true);
    });

    it('should handle value before currency', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>25.99</span><span>€</span>';

      const prices = extractNestedCurrencyPrices(element);

      expect(prices.some((p) => p.text === '€25.99')).toBe(true);
    });
  });

  describe('extractContextualPrices', () => {
    it('should extract "from" prices', () => {
      const element = document.createElement('div');
      element.textContent = 'Starting from $2.99';

      const prices = extractContextualPrices(element);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('$2.99');
      expect(prices[0].source).toBe('contextual-pattern');
    });

    it('should extract "under" prices', () => {
      const element = document.createElement('div');
      element.textContent = 'All items under $20';

      const prices = extractContextualPrices(element);

      expect(prices.some((p) => p.text === '$20')).toBe(true);
    });
  });

  describe('detectPriceCurrency', () => {
    it('should detect USD', () => {
      expect(detectPriceCurrency('$25.99')).toBe('USD');
      expect(detectPriceCurrency('USD 25.99')).toBe('USD');
    });

    it('should detect EUR', () => {
      expect(detectPriceCurrency('€30.00')).toBe('EUR');
      expect(detectPriceCurrency('30.00€')).toBe('EUR');
      expect(detectPriceCurrency('EUR 30')).toBe('EUR');
    });

    it('should detect GBP', () => {
      expect(detectPriceCurrency('£20.00')).toBe('GBP');
      expect(detectPriceCurrency('GBP 20')).toBe('GBP');
    });

    it('should detect other currencies', () => {
      expect(detectPriceCurrency('¥1000')).toBe('JPY');
      expect(detectPriceCurrency('₹500')).toBe('INR');
      expect(detectPriceCurrency('₽1000')).toBe('RUB');
    });

    it('should detect cents as USD', () => {
      expect(detectPriceCurrency('99¢')).toBe('USD');
    });

    it('should return null for unknown currencies', () => {
      expect(detectPriceCurrency('123')).toBe(null);
      expect(detectPriceCurrency('price')).toBe(null);
    });
  });

  describe('filterByCurrency', () => {
    const prices = [
      { text: '$25.99' },
      { text: '€30.00' },
      { text: '£20.00' },
      { text: '123' }, // No currency
    ];

    it('should filter to USD only', () => {
      const filtered = filterByCurrency(prices, 'USD');

      expect(filtered).toHaveLength(2); // $25.99 and 123 (unknown currency)
      expect(filtered.some((p) => p.text === '$25.99')).toBe(true);
      expect(filtered.some((p) => p.text === '123')).toBe(true);
    });

    it('should filter to EUR only', () => {
      const filtered = filterByCurrency(prices, 'EUR');

      expect(filtered).toHaveLength(2); // €30.00 and 123
      expect(filtered.some((p) => p.text === '€30.00')).toBe(true);
    });

    it('should return all prices if no currency specified', () => {
      const filtered = filterByCurrency(prices, null);
      expect(filtered).toHaveLength(4);
    });

    it('should handle empty arrays', () => {
      expect(filterByCurrency([], 'USD')).toEqual([]);
      expect(filterByCurrency(null, 'USD')).toBe(null);
    });
  });

  describe('processWithUniversalExtractor', () => {
    it('should process element and call callback for each price', () => {
      const element = document.createElement('div');
      element.textContent = '$25.99 and €30.00';

      const processedPrices = [];
      const callback = (textNode) => {
        processedPrices.push(textNode.textContent);
      };

      const settings = { currencyCode: 'USD' };
      const result = processWithUniversalExtractor(element, callback, settings);

      expect(result).toBe(true);
      expect(processedPrices).toHaveLength(1);
      expect(processedPrices[0]).toBe('$25.99');
    });

    it('should return false for non-element nodes', () => {
      const textNode = document.createTextNode('$25.99');
      let callCount = 0;
      const callback = () => {
        callCount++;
      };

      const result = processWithUniversalExtractor(textNode, callback, {});

      expect(result).toBe(false);
      expect(callCount).toBe(0);
    });

    it('should return false if no prices found', () => {
      const element = document.createElement('div');
      element.textContent = 'No prices here';

      let callCount = 0;
      const callback = () => {
        callCount++;
      };
      const result = processWithUniversalExtractor(element, callback, {});

      expect(result).toBe(false);
      expect(callCount).toBe(0);
    });
  });

  describe('extractPricesFromTextNode', () => {
    it('should extract standard prices', () => {
      const prices = extractPricesFromTextNode('Price is $25.99', {});

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('$25.99');
    });

    it('should extract spaced prices', () => {
      const prices = extractPricesFromTextNode('€ 14,32', {});

      expect(prices.some((p) => p.text === '€ 14,32')).toBe(true);
    });

    it('should extract contextual prices', () => {
      const prices = extractPricesFromTextNode('from $2.99', {});

      expect(prices.some((p) => p.text === '$2.99')).toBe(true);
    });

    it('should filter by currency', () => {
      const settings = { currencyCode: 'EUR' };
      const prices = extractPricesFromTextNode('$25.99 or €30.00', settings);

      expect(prices).toHaveLength(1);
      expect(prices[0].text).toBe('€30.00');
    });

    it('should handle empty text', () => {
      expect(extractPricesFromTextNode('', {})).toEqual([]);
      expect(extractPricesFromTextNode(null, {})).toEqual([]);
      expect(extractPricesFromTextNode('   ', {})).toEqual([]);
    });
  });

  describe('Universal Pattern Coverage', () => {
    it('should work on Cdiscount-style prices anywhere', () => {
      const element = document.createElement('div');
      element.className = 'random-class'; // Not Cdiscount specific
      element.textContent = '449€ 00';

      const prices = extractPrices(element);

      expect(prices.some((p) => p.text === '449€00')).toBe(true);
    });

    it('should work on Gearbest-style nested currency anywhere', () => {
      const element = document.createElement('div');
      element.className = 'some-price'; // Not Gearbest specific
      element.innerHTML = '<span>US$</span><span>34.56</span>';

      const prices = extractPrices(element);

      expect(prices.some((p) => p.text === 'US$34.56')).toBe(true);
    });

    it('should extract complex e-commerce patterns universally', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="product">
          <span data-price="$25.99">$25.99</span>
          <del>$30.00</del>
          <div>Save $4.01</div>
          <small>from $2.99</small>
        </div>
      `;

      const prices = extractPrices(element);

      // Should find multiple prices
      expect(prices.length).toBeGreaterThan(0);
      expect(prices.some((p) => p.text === '$25.99')).toBe(true);
      expect(prices.some((p) => p.text === '$30.00')).toBe(true);
      expect(prices.some((p) => p.text === '$4.01')).toBe(true);
      expect(prices.some((p) => p.text === '$2.99')).toBe(true);
    });
  });
});

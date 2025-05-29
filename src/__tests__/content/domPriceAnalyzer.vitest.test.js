/**
 * Tests for DOM Price Analyzer module
 * Test-first development approach with real HTML examples
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';
import { JSDOM } from 'jsdom';

// Import the module we're going to create
import { extractPricesFromElement } from '../../content/domPriceAnalyzer.js';

describe('DOM Price Analyzer', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  describe('API Contract', () => {
    test('extractPricesFromElement returns expected structure', () => {
      const html = '<span>$10.00</span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      // Expected structure
      expect(result).toHaveProperty('prices');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.prices)).toBe(true);
      expect(typeof result.metadata).toBe('object');
    });

    test('handles invalid input gracefully', () => {
      const result = extractPricesFromElement(null);

      expect(result.prices).toEqual([]);
      expect(result.metadata.error).toBeDefined();
    });
  });

  describe('Attribute Extraction Strategy', () => {
    test('extracts price from aria-label attribute', () => {
      const html = '<span aria-label="$8.48" class="a-size-base a-color-price"> $8.48 </span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '8.48',
        currency: '$',
        strategy: 'attribute',
        source: 'aria-label',
      });
    });

    test('extracts price from data attributes', () => {
      const html = '<div data-price="12.34" data-currency="USD">Special Offer</div>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '12.34',
        currency: 'USD',
        strategy: 'attribute',
        source: 'data-price',
      });
    });

    test('handles Amazon offscreen price structure', () => {
      const html = `
        <span class="a-price" data-a-strike="true">
          <span class="a-offscreen">$18.99</span>
          <span aria-hidden="true">$18.99</span>
        </span>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '18.99',
        currency: '$',
        strategy: 'attribute',
      });
    });
  });

  describe('Split Component Assembly Strategy', () => {
    test('assembles Cdiscount split euro format', () => {
      const html = `
        <span class="c-price c-price--promo c-price--md">
          <font style="vertical-align: inherit;">
            <font style="vertical-align: inherit;">449€ </font>
          </font>
          <span itemprop="priceCurrency">
            <font style="vertical-align: inherit;">
              <font style="vertical-align: inherit;">00</font>
            </font>
          </span>
        </span>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '449.00',
        currency: '€',
        strategy: 'splitComponent',
      });
    });

    test('assembles Amazon split price components', () => {
      const html = `
        <span aria-hidden="true">
          <span class="a-price-symbol">$</span>
          <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
          <span class="a-price-fraction">48</span>
        </span>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '8.48',
        currency: '$',
        strategy: 'splitComponent',
      });
    });

    test('handles simple split format', () => {
      const html = '<div><span>$</span><span>100</span></div>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '100',
        currency: '$',
        strategy: 'splitComponent',
      });
    });
  });

  describe('Nested Currency Strategy', () => {
    test('extracts Gearbest WooCommerce structure', () => {
      const html = `
        <span class="woocommerce-Price-amount amount">
          <bdi>
            6.26
            <span class="woocommerce-Price-currencySymbol">$</span>
          </bdi>
        </span>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '6.26',
        currency: '$',
        strategy: 'nestedCurrency',
      });
    });

    test('handles currency symbol in child span', () => {
      const html = '<span>25.99<span class="currency">€</span></span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '25.99',
        currency: '€',
        strategy: 'nestedCurrency',
      });
    });
  });

  describe('Contextual Phrase Strategy', () => {
    test('extracts price from "Under $X" context', () => {
      const html = '<span class="a-size-small a-color-base truncate-2line">Under $20</span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '20',
        currency: '$',
        strategy: 'contextual',
        context: 'under',
      });
    });

    test('extracts price from "from $X" context', () => {
      const html =
        '<h2 class="a-color-base headline truncate-2line">Crazy-good finds from $2.99</h2>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0]).toMatchObject({
        value: '2.99',
        currency: '$',
        strategy: 'contextual',
        context: 'from',
      });
    });
  });

  describe('Strategy Priority and Fallbacks', () => {
    test('prefers attribute extraction over text content', () => {
      const html = '<span aria-label="$12.99">Sale Price: $15.99</span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].value).toBe('12.99');
      expect(result.prices[0].strategy).toBe('attribute');
    });

    test('falls back to split component when no attributes', () => {
      const html = '<div><span>€</span><span>45</span><span>.50</span></div>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(1);
      expect(result.prices[0].strategy).toBe('splitComponent');
    });

    test('handles multiple extraction strategies finding different prices', () => {
      const html = `
        <div data-price="19.99" data-currency="USD">
          <span>$25.00</span>
          <span class="original">Was $30.00</span>
        </div>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element, { allowMultipleResults: true });

      // Should return multiple prices with confidence scores
      expect(result.prices.length).toBeGreaterThan(1);

      // Highest confidence should be attribute-based
      const sortedByConfidence = result.prices.sort((a, b) => b.confidence - a.confidence);
      expect(sortedByConfidence[0].strategy).toBe('attribute');
    });
  });

  describe('Real Examples from examples.md', () => {
    const examples = [
      {
        name: 'Cdiscount 272.46 €',
        html: '<font style="vertical-align: inherit;">272.46 €</font>',
        expected: { value: '272.46', currency: '€' },
      },
      {
        name: 'Cdiscount 596.62€',
        html: '<font style="vertical-align: inherit;">596.62€</font>',
        expected: { value: '596.62', currency: '€' },
      },
      {
        name: 'eBay $350.00',
        html: '<span class="textual-display bsig__price bsig__price--displayprice">$350.00</span>',
        expected: { value: '350.00', currency: '$' },
      },
      {
        name: 'eBay strikethrough',
        html: '<span class="textual-display bsig__generic bsig__previousPrice strikethrough">$144.54<span class="textual-display clipped">was - US $144.54</span></span>',
        expected: { value: '144.54', currency: '$' },
      },
      {
        name: 'eBay simple',
        html: '<span class="ux-textspans">$122.49</span>',
        expected: { value: '122.49', currency: '$' },
      },
      {
        name: 'Zillow large number',
        html: '<span data-test="property-card-price" class="PropertyCardWrapper__StyledPriceLine-srp-8-109-3__sc-16e8gqd-1 jCoXOF">$2,500,000</span>',
        expected: { value: '2500000', currency: '$' },
      },
    ];

    examples.forEach(({ name, html, expected }) => {
      test(`extracts ${name}`, () => {
        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;

        const result = extractPricesFromElement(element);

        expect(result.prices).toHaveLength(1);
        expect(result.prices[0]).toMatchObject(expected);
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    test('handles deeply nested elements efficiently', () => {
      let html = '<div>';
      for (let i = 0; i < 50; i++) {
        html += '<div>';
      }
      html += '$99.99';
      for (let i = 0; i < 50; i++) {
        html += '</div>';
      }
      html += '</div>';

      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const start = Date.now();
      const result = extractPricesFromElement(element);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should complete in under 100ms
      expect(result.prices).toHaveLength(1);
    });

    test('handles elements with no price content', () => {
      const html = '<div><p>No prices here</p><span>Just text</span></div>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.prices).toHaveLength(0);
      expect(result.metadata.strategiesAttempted).toBeDefined();
    });

    test('provides detailed metadata for debugging', () => {
      const html = '<span aria-label="$15.99">Price</span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.metadata).toMatchObject({
        strategiesAttempted: expect.any(Array),
        extractionTime: expect.any(Number),
        elementType: 'span',
        hasChildren: expect.any(Boolean),
      });
    });
  });
});

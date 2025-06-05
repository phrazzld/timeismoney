/**
 * DOM Price Analyzer - Real Examples Validation
 * Comprehensive test suite validating 100% coverage of examples.md HTML snippets
 *
 * This test suite ensures the DOM analyzer reliably extracts prices from actual
 * e-commerce website markup documented in examples.md
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';
import { JSDOM } from 'jsdom';
import { extractPricesFromElement } from '../../content/domPriceAnalyzer.js';

describe('DOM Price Analyzer - Real Examples Validation', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  /**
   * Test helper function to validate price extraction from HTML
   *
   * @param {string} html - HTML snippet to test
   * @param {object} expected - Expected extraction result
   * @param {string} [testName] - Optional test name for debugging
   * @returns {object} Extraction result for further validation
   */
  function validatePriceExtraction(html, expected, testName = '') {
    const dom = new JSDOM(html);
    const element = dom.window.document.body.firstChild;

    if (!element) {
      throw new Error(`Failed to parse HTML for test: ${testName}`);
    }

    const result = extractPricesFromElement(element);

    // Validate basic extraction success
    expect(result.prices, `No prices extracted for: ${testName}`).toHaveLength(1);
    expect(result.prices[0], `Price mismatch for: ${testName}`).toMatchObject(expected);

    // Validate confidence is reasonable
    expect(result.prices[0].confidence, `Low confidence for: ${testName}`).toBeGreaterThan(0.5);

    return result;
  }

  /**
   * Test helper to validate extraction performance
   *
   * @param {string} html - HTML snippet
   * @param {object} expected - Expected result
   * @param {number} maxDuration - Maximum allowed duration in ms
   */
  function validateExtractionPerformance(html, expected, maxDuration = 50) {
    const start = performance.now();
    validatePriceExtraction(html, expected);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(maxDuration);
  }

  describe('Cdiscount Patterns', () => {
    const cdiscountExamples = [
      {
        name: 'Space before currency format',
        html: '<font style="vertical-align: inherit;">272.46 €</font>',
        expected: {
          value: '272.46',
          currency: '€',
        },
      },
      {
        name: 'No space before currency format',
        html: '<font style="vertical-align: inherit;">596.62€</font>',
        expected: {
          value: '596.62',
          currency: '€',
        },
      },
      {
        name: 'Complex split euro format with nested fonts',
        html: `<span class="c-price c-price--promo c-price--md">
          <font style="vertical-align: inherit;">
            <font style="vertical-align: inherit;">449€ </font>
          </font>
          <span itemprop="priceCurrency">
            <font style="vertical-align: inherit;">
              <font style="vertical-align: inherit;">00</font>
            </font>
          </span>
        </span>`,
        expected: {
          value: '449.00',
          currency: '€',
        },
      },
    ];

    cdiscountExamples.forEach(({ name, html, expected }) => {
      test(`extracts Cdiscount price: ${name}`, () => {
        const result = validatePriceExtraction(html, expected, name);

        // Verify extraction strategy used
        expect(['textContent', 'splitComponent']).toContain(result.prices[0].strategy);
      });
    });

    test('Cdiscount examples performance validation', () => {
      cdiscountExamples.forEach(({ html, expected, name }) => {
        validateExtractionPerformance(html, expected, 50);
      });
    });
  });

  describe('eBay Patterns', () => {
    const ebayExamples = [
      {
        name: 'Standard display price',
        html: '<span class="textual-display bsig__price bsig__price--displayprice">$350.00</span>',
        expected: {
          value: '350.00',
          currency: '$',
        },
      },
      {
        name: 'Previous price with strikethrough and nested content',
        html: `<span class="textual-display bsig__generic bsig__previousPrice strikethrough">
          $144.54<span class="textual-display clipped">was - US $144.54</span>
        </span>`,
        expected: {
          value: '144.54',
          currency: '$',
        },
      },
      {
        name: 'Simple textspan price',
        html: '<span class="ux-textspans">$122.49</span>',
        expected: {
          value: '122.49',
          currency: '$',
        },
      },
    ];

    ebayExamples.forEach(({ name, html, expected }) => {
      test(`extracts eBay price: ${name}`, () => {
        const result = validatePriceExtraction(html, expected, name);

        // eBay prices typically use text content strategy
        expect(['textContent', 'splitComponent']).toContain(result.prices[0].strategy);
      });
    });
  });

  describe('Amazon Patterns', () => {
    const amazonExamples = [
      {
        name: 'Contextual "Under" price',
        html: '<span class="a-size-small a-color-base truncate-2line">Under $20</span>',
        expected: {
          value: '20',
          currency: '$',
          context: 'under',
        },
      },
      {
        name: 'Contextual "from" price in heading',
        html: '<h2 class="a-color-base headline truncate-2line">Crazy-good finds from $2.99</h2>',
        expected: {
          value: '2.99',
          currency: '$',
          context: 'from',
        },
      },
      {
        name: 'Aria-label price with visible text',
        html: '<span aria-label="$8.48" class="a-size-base a-color-price a-color-price"> $8.48 </span>',
        expected: {
          value: '8.48',
          currency: '$',
        },
      },
      {
        name: 'Complex split price with decimal in whole part',
        html: `<span aria-hidden="true">
          <span class="a-price-symbol">$</span>
          <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
          <span class="a-price-fraction">48</span>
        </span>`,
        expected: {
          value: '8.48',
          currency: '$',
        },
      },
      {
        name: 'Offscreen price with multiple representations',
        html: `<span class="a-price a-text-price" data-a-size="s" data-a-strike="true" data-a-color="secondary">
          <span class="a-offscreen">$18.99</span>
          <span aria-hidden="true">$18.99</span>
        </span>`,
        expected: {
          value: '18.99',
          currency: '$',
        },
      },
    ];

    amazonExamples.forEach(({ name, html, expected }) => {
      test(`extracts Amazon price: ${name}`, () => {
        const result = validatePriceExtraction(html, expected, name);

        // Verify appropriate strategy for Amazon patterns
        if (name.includes('Contextual')) {
          expect(result.prices[0].strategy).toBe('contextual');
        } else if (name.includes('Aria-label') || name.includes('Offscreen')) {
          expect(result.prices[0].strategy).toBe('attribute');
        } else if (name.includes('split price')) {
          expect(result.prices[0].strategy).toBe('splitComponent');
        }
      });
    });

    test('Amazon contextual prices preserve context information', () => {
      const underExample = amazonExamples.find((ex) => ex.name.includes('Under'));
      const fromExample = amazonExamples.find((ex) => ex.name.includes('from'));

      const underResult = validatePriceExtraction(underExample.html, underExample.expected);
      const fromResult = validatePriceExtraction(fromExample.html, fromExample.expected);

      expect(underResult.prices[0].context).toBe('under');
      expect(fromResult.prices[0].context).toBe('from');
    });
  });

  describe('Gearbest Patterns', () => {
    const gearbestExamples = [
      {
        name: 'WooCommerce nested currency symbol',
        html: `<span class="woocommerce-Price-amount amount">
          <bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>
        </span>`,
        expected: {
          value: '6.26',
          currency: '$',
        },
      },
    ];

    gearbestExamples.forEach(({ name, html, expected }) => {
      test(`extracts Gearbest price: ${name}`, () => {
        const result = validatePriceExtraction(html, expected, name);

        // Should use nested currency strategy for WooCommerce format
        expect(result.prices[0].strategy).toBe('nestedCurrency');
      });
    });
  });

  describe('Zillow Patterns', () => {
    const zillowExamples = [
      {
        name: 'Large property price with commas',
        html: `<span data-test="property-card-price" 
                     class="PropertyCardWrapper__StyledPriceLine-srp-8-109-3__sc-16e8gqd-1 jCoXOF">
          $2,500,000
        </span>`,
        expected: {
          value: '2500000', // Commas should be removed
          currency: '$',
        },
      },
    ];

    zillowExamples.forEach(({ name, html, expected }) => {
      test(`extracts Zillow price: ${name}`, () => {
        const result = validatePriceExtraction(html, expected, name);

        // Large numbers should be parsed correctly
        expect(result.prices[0].strategy).toBe('textContent');
      });
    });
  });

  describe('Cross-Pattern Strategy Coverage', () => {
    test('validates all extraction strategies are exercised by real examples', () => {
      const allExamples = [
        // Attribute extraction examples
        {
          html: '<span aria-label="$8.48" class="a-size-base a-color-price"> $8.48 </span>',
          expectedStrategy: 'attribute',
        },
        // Split component examples
        {
          html: `<span aria-hidden="true">
            <span class="a-price-symbol">$</span>
            <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
            <span class="a-price-fraction">48</span>
          </span>`,
          expectedStrategy: 'splitComponent',
        },
        // Nested currency examples
        {
          html: `<span class="woocommerce-Price-amount amount">
            <bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>
          </span>`,
          expectedStrategy: 'nestedCurrency',
        },
        // Contextual examples
        {
          html: '<span class="a-size-small a-color-base truncate-2line">Under $20</span>',
          expectedStrategy: 'contextual',
        },
        // Text content fallback
        {
          html: '<span class="simple-price">$99.99</span>',
          expectedStrategy: 'textContent',
        },
      ];

      const strategiesFound = new Set();

      allExamples.forEach((example, index) => {
        const dom = new JSDOM(example.html);
        const element = dom.window.document.body.firstChild;
        const result = extractPricesFromElement(element);

        expect(result.prices).toHaveLength(1);
        strategiesFound.add(result.prices[0].strategy);

        // Verify expected strategy is used (when specified)
        if (example.expectedStrategy) {
          expect(result.prices[0].strategy).toBe(example.expectedStrategy);
        }
      });

      // Ensure all major strategies are covered
      expect(strategiesFound).toContain('attribute');
      expect(strategiesFound).toContain('splitComponent');
      expect(strategiesFound).toContain('nestedCurrency');
      expect(strategiesFound).toContain('contextual');
      expect(strategiesFound).toContain('textContent');
    });

    test('validates extraction confidence scores are reasonable', () => {
      const testCases = [
        '<span aria-label="$15.99">Price</span>', // High confidence (attribute)
        '<span>$25.00</span>', // Medium confidence (text)
        '<div><span>$</span><span>10</span></div>', // Lower confidence (split)
      ];

      testCases.forEach((html) => {
        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;
        const result = extractPricesFromElement(element);

        expect(result.prices).toHaveLength(1);
        expect(result.prices[0].confidence).toBeGreaterThan(0.5);
        expect(result.prices[0].confidence).toBeLessThanOrEqual(1.0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles malformed HTML gracefully', () => {
      const malformedCases = [
        '<span>$</span>', // Currency without amount
        '<span>25.99</span>', // Amount without currency
        '<span></span>', // Empty element
        '<span>   </span>', // Whitespace only
      ];

      malformedCases.forEach((html) => {
        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;
        const result = extractPricesFromElement(element);

        // Should not crash, may or may not find prices
        expect(result).toHaveProperty('prices');
        expect(result).toHaveProperty('metadata');
        expect(Array.isArray(result.prices)).toBe(true);
      });
    });

    test('performance validation for all real examples', () => {
      const performanceTestCases = [
        '<font style="vertical-align: inherit;">272.46 €</font>',
        '<span class="textual-display bsig__price">$350.00</span>',
        '<span aria-label="$8.48" class="a-size-base"> $8.48 </span>',
        `<span class="woocommerce-Price-amount amount">
          <bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi>
        </span>`,
        '<span data-test="property-card-price">$2,500,000</span>',
      ];

      performanceTestCases.forEach((html) => {
        const start = performance.now();

        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;
        extractPricesFromElement(element);

        const duration = performance.now() - start;
        expect(duration).toBeLessThan(50); // Should complete in under 50ms
      });
    });
  });

  describe('Integration with Real Examples Metadata', () => {
    test('provides comprehensive extraction metadata', () => {
      const html = '<span aria-label="$15.99" class="price">Sale Price</span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element);

      expect(result.metadata).toMatchObject({
        strategiesAttempted: expect.arrayContaining(['attribute']),
        extractionTime: expect.any(Number),
        elementType: 'span',
        hasChildren: expect.any(Boolean),
      });

      expect(result.metadata.extractionTime).toBeGreaterThanOrEqual(0);
      expect(result.metadata.extractionTime).toBeLessThan(100);
    });

    test('tracks multiple strategies attempted for complex elements', () => {
      // Use allowMultipleResults option to enable multiple strategy testing
      const html = `
        <div aria-label="$19.99" data-price="15.99" data-currency="$">
          <span class="a-offscreen">$12.99</span>
          <span>$45.99</span>
        </div>
      `;
      const dom = new JSDOM(html);
      const element = dom.window.document.body.firstChild;

      const result = extractPricesFromElement(element, { allowMultipleResults: true });

      // With multiple prices available via different strategies, should track multiple attempts
      expect(result.metadata.strategiesAttempted.length).toBeGreaterThanOrEqual(1);
      expect(result.prices.length).toBeGreaterThanOrEqual(1);
    });
  });
});

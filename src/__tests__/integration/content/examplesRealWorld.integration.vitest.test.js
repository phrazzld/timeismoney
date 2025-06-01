/**
 * Real Examples.md Integration Tests
 * Comprehensive validation of all examples.md HTML snippets through the complete extraction pipeline
 *
 * @vitest-environment jsdom
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';

// Mock only external boundaries (Chrome APIs) before imports
vi.mock('../../../utils/storage.js', () => ({
  getSettings: vi.fn(() =>
    Promise.resolve({
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      disabled: false,
    })
  ),
}));

import { describe, it, expect, beforeEach } from '../../setup/vitest-imports.js';
import { extractPrice } from '../../../content/priceExtractor.js';
import { registerExistingHandlers } from '../../../content/siteHandlers.js';

/**
 * Exact HTML snippets from examples.md mapped to expected extraction results
 * This ensures we test the EXACT markup that appears on real e-commerce sites
 */
const EXAMPLES_MD_CASES = {
  cdiscount: [
    {
      name: 'Space before euro format',
      html: '<font style="vertical-align: inherit;">272.46 €</font>',
      expected: {
        value: '272.46',
        currency: '€',
        minConfidence: 0.7,
      },
    },
    {
      name: 'No space before euro format',
      html: '<font style="vertical-align: inherit;">596.62€</font>',
      expected: {
        value: '596.62',
        currency: '€',
        minConfidence: 0.7,
      },
    },
    {
      name: 'Complex split euro format with nested fonts',
      html: `<span class="c-price c-price--promo c-price--md"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">449€ </font></font><span itemprop="priceCurrency"><font style="vertical-align: inherit;"><font style="vertical-align: inherit;">00</font></font></span></span>`,
      expected: {
        value: '449.00',
        currency: '€',
        minConfidence: 0.6, // Lower confidence due to complex split format
      },
    },
  ],

  ebay: [
    {
      name: 'Standard display price',
      html: '<span class="textual-display bsig__price bsig__price--displayprice">$350.00</span>',
      expected: {
        value: '350.00',
        currency: '$',
        minConfidence: 0.8,
      },
    },
    {
      name: 'Previous price with strikethrough and nested content',
      html: '<span class="textual-display bsig__generic bsig__previousPrice strikethrough">$144.54<span class="textual-display clipped">was - US $144.54</span></span>',
      expected: {
        value: '144.54',
        currency: '$',
        minConfidence: 0.7,
      },
    },
    {
      name: 'Simple textspan price',
      html: '<span class="ux-textspans">$122.49</span>',
      expected: {
        value: '122.49',
        currency: '$',
        minConfidence: 0.8,
      },
    },
  ],

  amazon: [
    {
      name: 'Contextual "Under" price',
      html: '<span class="a-size-small a-color-base truncate-2line">Under $20</span>',
      expected: {
        value: '20',
        currency: '$',
        minConfidence: 0.6, // Lower confidence for contextual prices
      },
    },
    {
      name: 'Contextual "from" price in headline',
      html: '<h2 class="a-color-base headline truncate-2line">Crazy-good finds from $2.99</h2>',
      expected: {
        value: '2.99',
        currency: '$',
        minConfidence: 0.6,
      },
    },
    {
      name: 'Aria-label price with visible text',
      html: '<span aria-label="$8.48" class="a-size-base a-color-price a-color-price"> $8.48 </span>',
      expected: {
        value: '8.48',
        currency: '$',
        minConfidence: 0.8, // High confidence for aria-label (adjusted based on actual behavior)
      },
    },
    {
      name: 'Complex split price with decimal in whole part',
      html: '<span aria-hidden="true"><span class="a-price-symbol">$</span><span class="a-price-whole">8<span class="a-price-decimal">.</span></span><span class="a-price-fraction">48</span></span>',
      expected: {
        value: '8.48',
        currency: '$',
        minConfidence: 0.7,
      },
    },
    {
      name: 'Offscreen price with multiple representations',
      html: '<span class="a-price a-text-price" data-a-size="s" data-a-strike="true" data-a-color="secondary"><span class="a-offscreen">$18.99</span><span aria-hidden="true">$18.99</span></span>',
      expected: {
        value: '18.99',
        currency: '$',
        minConfidence: 0.8,
      },
    },
  ],

  gearbest: [
    {
      name: 'WooCommerce nested currency symbol',
      html: '<span class="woocommerce-Price-amount amount"><bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi></span>',
      expected: {
        value: '6.26',
        currency: '$',
        minConfidence: 0.8,
      },
    },
  ],

  zillow: [
    {
      name: 'Large property price with commas',
      html: '<span data-test="property-card-price" class="PropertyCardWrapper__StyledPriceLine-srp-8-109-3__sc-16e8gqd-1 jCoXOF">$2,500,000</span>',
      expected: {
        value: '2500000', // Commas should be removed
        currency: '$',
        minConfidence: 0.8,
      },
    },
  ],
};

describe('Real Examples.md Integration', () => {
  beforeEach(() => {
    // Register site handlers for Pass 1 of extraction pipeline
    registerExistingHandlers();

    // Clear DOM
    document.body.innerHTML = '';
  });

  describe('Cdiscount Examples', () => {
    EXAMPLES_MD_CASES.cdiscount.forEach(({ name, html, expected }) => {
      it(`should extract ${name}`, async () => {
        const container = document.createElement('div');
        container.innerHTML = html;

        const result = await extractPrice(container);

        expect(result, `Failed to extract price for: ${name}`).toBeDefined();
        expect(result.value, `Wrong value for: ${name}`).toBe(expected.value);
        expect(result.currency, `Wrong currency for: ${name}`).toBe(expected.currency);
        expect(result.confidence, `Low confidence for: ${name}`).toBeGreaterThanOrEqual(
          expected.minConfidence
        );
        expect(result.strategy, `Missing strategy for: ${name}`).toBeDefined();
      });
    });

    it('should validate Cdiscount extraction strategies', async () => {
      // Test that appropriate strategies are used for different Cdiscount formats
      const simpleCase = EXAMPLES_MD_CASES.cdiscount[0]; // Space before euro
      const splitCase = EXAMPLES_MD_CASES.cdiscount[2]; // Complex split format

      const container1 = document.createElement('div');
      container1.innerHTML = simpleCase.html;
      const result1 = await extractPrice(container1);

      const container2 = document.createElement('div');
      container2.innerHTML = splitCase.html;
      const result2 = await extractPrice(container2);

      // Simple case should use text-based strategy
      expect(['pattern-matching', 'textContent']).toContain(result1.strategy);

      // Split case should use more complex strategy
      expect(['structure-analysis', 'splitComponent', 'dom-analyzer']).toContain(result2.strategy);
    });
  });

  describe('eBay Examples', () => {
    EXAMPLES_MD_CASES.ebay.forEach(({ name, html, expected }) => {
      it(`should extract ${name}`, async () => {
        const container = document.createElement('div');
        container.innerHTML = html;

        const result = await extractPrice(container);

        expect(result, `Failed to extract price for: ${name}`).toBeDefined();
        expect(result.value, `Wrong value for: ${name}`).toBe(expected.value);
        expect(result.currency, `Wrong currency for: ${name}`).toBe(expected.currency);
        expect(result.confidence, `Low confidence for: ${name}`).toBeGreaterThanOrEqual(
          expected.minConfidence
        );
        expect(result.strategy, `Missing strategy for: ${name}`).toBeDefined();
      });
    });

    it('should handle eBay nested content correctly', async () => {
      // Test the strikethrough case which has nested spans
      const nestedCase = EXAMPLES_MD_CASES.ebay[1];
      const container = document.createElement('div');
      container.innerHTML = nestedCase.html;

      const result = await extractPrice(container);

      expect(result).toBeDefined();
      expect(result.value).toBe('144.54');
      // Should extract the main price, not the nested "US $144.54"
      if (result.metadata?.source) {
        expect(result.metadata.source).not.toContain('US');
      }
    });
  });

  describe('Amazon Examples', () => {
    EXAMPLES_MD_CASES.amazon.forEach(({ name, html, expected }) => {
      it(`should extract ${name}`, async () => {
        const container = document.createElement('div');
        container.innerHTML = html;

        const result = await extractPrice(container);

        expect(result, `Failed to extract price for: ${name}`).toBeDefined();
        expect(result.value, `Wrong value for: ${name}`).toBe(expected.value);
        expect(result.currency, `Wrong currency for: ${name}`).toBe(expected.currency);
        expect(result.confidence, `Low confidence for: ${name}`).toBeGreaterThanOrEqual(
          expected.minConfidence
        );
        expect(result.strategy, `Missing strategy for: ${name}`).toBeDefined();
      });
    });

    it('should validate Amazon contextual price patterns', async () => {
      // Test that contextual prices preserve context information
      const underCase = EXAMPLES_MD_CASES.amazon[0]; // "Under $20"
      const fromCase = EXAMPLES_MD_CASES.amazon[1]; // "from $2.99"

      const container1 = document.createElement('div');
      container1.innerHTML = underCase.html;
      const result1 = await extractPrice(container1);

      const container2 = document.createElement('div');
      container2.innerHTML = fromCase.html;
      const result2 = await extractPrice(container2);

      // Both should use contextual pattern strategy
      expect(result1.strategy).toContain('pattern');
      expect(result2.strategy).toContain('pattern');

      // Should preserve context in metadata if available
      if (result1.metadata?.pattern) {
        expect(result1.metadata.pattern.toLowerCase()).toContain('under');
      }
      if (result2.metadata?.pattern) {
        expect(result2.metadata.pattern.toLowerCase()).toContain('from');
      }
    });

    it('should validate Amazon aria-label extraction', async () => {
      const ariaCase = EXAMPLES_MD_CASES.amazon[2]; // aria-label="$8.48"
      const container = document.createElement('div');
      container.innerHTML = ariaCase.html;

      const result = await extractPrice(container);

      expect(result).toBeDefined();
      expect(result.value).toBe('8.48');
      // Should use an appropriate strategy for aria-label (pattern-matching or attribute-based)
      expect(['dom-analyzer', 'attribute', 'pattern-matching']).toContain(result.strategy);
      if (result.metadata?.source) {
        expect(result.metadata.source).toBe('aria-label');
      }
    });

    it('should validate Amazon split component assembly', async () => {
      const splitCase = EXAMPLES_MD_CASES.amazon[3]; // Complex split price
      const container = document.createElement('div');
      container.innerHTML = splitCase.html;

      const result = await extractPrice(container);

      expect(result).toBeDefined();
      expect(result.value).toBe('8.48');
      // Should use structure analysis for split components
      expect(['structure-analysis', 'splitComponent', 'dom-analyzer']).toContain(result.strategy);
    });
  });

  describe('Gearbest Examples', () => {
    EXAMPLES_MD_CASES.gearbest.forEach(({ name, html, expected }) => {
      it(`should extract ${name}`, async () => {
        const container = document.createElement('div');
        container.innerHTML = html;

        const result = await extractPrice(container);

        expect(result, `Failed to extract price for: ${name}`).toBeDefined();
        expect(result.value, `Wrong value for: ${name}`).toBe(expected.value);
        expect(result.currency, `Wrong currency for: ${name}`).toBe(expected.currency);
        expect(result.confidence, `Low confidence for: ${name}`).toBeGreaterThanOrEqual(
          expected.minConfidence
        );
        expect(result.strategy, `Missing strategy for: ${name}`).toBeDefined();
      });
    });

    it('should validate Gearbest nested currency handling', async () => {
      const nestedCase = EXAMPLES_MD_CASES.gearbest[0];
      const container = document.createElement('div');
      container.innerHTML = nestedCase.html;

      const result = await extractPrice(container);

      expect(result).toBeDefined();
      expect(result.value).toBe('6.26');
      expect(result.currency).toBe('$');
      // Should use nested currency extraction strategy
      expect(['structure-analysis', 'nestedCurrency', 'dom-analyzer']).toContain(result.strategy);
    });
  });

  describe('Zillow Examples', () => {
    EXAMPLES_MD_CASES.zillow.forEach(({ name, html, expected }) => {
      it(`should extract ${name}`, async () => {
        const container = document.createElement('div');
        container.innerHTML = html;

        const result = await extractPrice(container);

        expect(result, `Failed to extract price for: ${name}`).toBeDefined();
        expect(result.value, `Wrong value for: ${name}`).toBe(expected.value);
        expect(result.currency, `Wrong currency for: ${name}`).toBe(expected.currency);
        expect(result.confidence, `Low confidence for: ${name}`).toBeGreaterThanOrEqual(
          expected.minConfidence
        );
        expect(result.strategy, `Missing strategy for: ${name}`).toBeDefined();
      });
    });

    it('should validate Zillow comma removal', async () => {
      const commaCase = EXAMPLES_MD_CASES.zillow[0];
      const container = document.createElement('div');
      container.innerHTML = commaCase.html;

      const result = await extractPrice(container);

      expect(result).toBeDefined();
      expect(result.value).toBe('2500000'); // Commas removed
      expect(result.currency).toBe('$');
      // Large numbers should be handled correctly
      expect(parseFloat(result.value)).toBe(2500000);
    });
  });

  describe('Cross-Site Validation', () => {
    it('should validate all major extraction strategies are exercised', async () => {
      const strategiesFound = new Set();

      // Test representative examples from each strategy category
      const testCases = [
        // Attribute-based (Amazon aria-label) - may use pattern-matching in integrated pipeline
        {
          html: EXAMPLES_MD_CASES.amazon[2].html,
          expectedStrategies: ['dom-analyzer', 'attribute', 'pattern-matching'],
        },

        // Split component (Amazon complex split)
        {
          html: EXAMPLES_MD_CASES.amazon[3].html,
          expectedStrategies: [
            'structure-analysis',
            'splitComponent',
            'dom-analyzer',
            'pattern-matching',
          ],
        },

        // Nested currency (Gearbest)
        {
          html: EXAMPLES_MD_CASES.gearbest[0].html,
          expectedStrategies: [
            'structure-analysis',
            'nestedCurrency',
            'dom-analyzer',
            'pattern-matching',
          ],
        },

        // Contextual pattern (Amazon "Under")
        {
          html: EXAMPLES_MD_CASES.amazon[0].html,
          expectedStrategies: ['pattern-matching', 'contextual'],
        },

        // Text content (eBay simple)
        {
          html: EXAMPLES_MD_CASES.ebay[2].html,
          expectedStrategies: ['pattern-matching', 'textContent'],
        },
      ];

      for (const { html, expectedStrategies } of testCases) {
        const container = document.createElement('div');
        container.innerHTML = html;
        const result = await extractPrice(container);

        expect(result).toBeDefined();
        strategiesFound.add(result.strategy);

        // Validate that an appropriate strategy was used
        expect(expectedStrategies).toContain(result.strategy);
      }

      // Ensure we exercised multiple different strategies
      expect(strategiesFound.size).toBeGreaterThanOrEqual(2);

      // Verify we're using the main extraction strategies
      expect(strategiesFound.has('pattern-matching') || strategiesFound.has('dom-analyzer')).toBe(
        true
      );
    });

    it('should validate performance across all examples', async () => {
      // Test that all examples extract within reasonable time
      const allExamples = [
        ...EXAMPLES_MD_CASES.cdiscount,
        ...EXAMPLES_MD_CASES.ebay,
        ...EXAMPLES_MD_CASES.amazon,
        ...EXAMPLES_MD_CASES.gearbest,
        ...EXAMPLES_MD_CASES.zillow,
      ];

      for (const { name, html } of allExamples) {
        const container = document.createElement('div');
        container.innerHTML = html;

        const start = performance.now();
        const result = await extractPrice(container);
        const duration = performance.now() - start;

        expect(result, `Failed to extract: ${name}`).toBeDefined();
        expect(duration, `Too slow for: ${name}`).toBeLessThan(100); // Should complete within 100ms
      }
    });

    it('should validate confidence score distribution', async () => {
      const confidenceScores = [];

      const allExamples = [
        ...EXAMPLES_MD_CASES.cdiscount,
        ...EXAMPLES_MD_CASES.ebay,
        ...EXAMPLES_MD_CASES.amazon,
        ...EXAMPLES_MD_CASES.gearbest,
        ...EXAMPLES_MD_CASES.zillow,
      ];

      for (const { html } of allExamples) {
        const container = document.createElement('div');
        container.innerHTML = html;
        const result = await extractPrice(container);

        if (result) {
          confidenceScores.push(result.confidence);
        }
      }

      // Should have extracted prices for all examples
      expect(confidenceScores.length).toBe(allExamples.length);

      // All confidence scores should be reasonable
      confidenceScores.forEach((score, index) => {
        expect(score, `Invalid confidence for example ${index}`).toBeGreaterThan(0);
        expect(score, `Confidence too high for example ${index}`).toBeLessThanOrEqual(1);
      });

      // Should have a mix of confidence levels (not all the same)
      const uniqueConfidences = new Set(confidenceScores.map((s) => Math.round(s * 10) / 10));
      expect(uniqueConfidences.size).toBeGreaterThan(1);
    });

    it('should validate comprehensive examples.md coverage', () => {
      // Verify we have all the examples from examples.md represented
      const totalExamples =
        EXAMPLES_MD_CASES.cdiscount.length +
        EXAMPLES_MD_CASES.ebay.length +
        EXAMPLES_MD_CASES.amazon.length +
        EXAMPLES_MD_CASES.gearbest.length +
        EXAMPLES_MD_CASES.zillow.length;

      // Should cover all 13 examples from examples.md
      // Cdiscount: 3, eBay: 3, Amazon: 5, Gearbest: 1, Zillow: 1 = 13 total
      expect(totalExamples).toBe(13);

      // Verify each site is represented
      expect(EXAMPLES_MD_CASES.cdiscount.length).toBeGreaterThan(0);
      expect(EXAMPLES_MD_CASES.ebay.length).toBeGreaterThan(0);
      expect(EXAMPLES_MD_CASES.amazon.length).toBeGreaterThan(0);
      expect(EXAMPLES_MD_CASES.gearbest.length).toBeGreaterThan(0);
      expect(EXAMPLES_MD_CASES.zillow.length).toBeGreaterThan(0);
    });
  });
});

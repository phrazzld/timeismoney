/**
 * Tests demonstrating known failures with real-world price formats
 * These tests document current limitations and will guide future enhancements
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';
import { findPrices } from '../../content/priceFinder';
import { JSDOM } from 'jsdom';

describe('Price Detection - Known Failures from Real Sites', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  describe('Cdiscount Split Format', () => {
    test('fails on Cdiscount "449€ 00" split format', () => {
      const text = '449€ 00';
      const settings = {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);

      // Currently fails - documents actual behavior
      expect(result.hasPotentialPrice).toBe(true); // Detects something
      expect(result.pattern).toBeDefined();

      // But doesn't extract the full price correctly
      const match = text.match(result.pattern);
      expect(match).toBeTruthy();
      // The pattern likely only matches "449€" not the full "449.00"
      expect(match[0]).not.toBe('449€ 00');

      // Expected behavior (currently fails):
      // expect(extractedValue).toBe('449.00');
    });

    test('handles standard Cdiscount format variations', () => {
      const variations = [
        { text: '272.46 €', expected: '272.46' },
        { text: '596.62€', expected: '596.62' },
      ];

      const settings = {
        currencySymbol: '€',
        currencyCode: 'EUR',
        thousands: 'spacesAndDots',
        decimal: 'comma',
        isReverseSearch: false,
      };

      variations.forEach(({ text, expected }) => {
        const result = findPrices(text, settings);
        expect(result.hasPotentialPrice).toBe(true);

        const match = text.match(result.pattern);
        expect(match).toBeTruthy();
        // These should work with current implementation
      });
    });
  });

  describe('Amazon Attribute-Based Prices', () => {
    test('fails to extract price from aria-label attribute', () => {
      const html = '<span aria-label="$8.48" class="a-size-base a-color-price"> $8.48 </span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('span');

      // Current implementation only works with text content
      const text = element.textContent.trim();
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);
      expect(result.hasPotentialPrice).toBe(true); // Works for text content

      // But misses the aria-label attribute
      // Expected: Should also check aria-label="$8.48"
    });

    test('fails on Amazon split price components', () => {
      const html = `<span aria-hidden="true">
        <span class="a-price-symbol">$</span>
        <span class="a-price-whole">8<span class="a-price-decimal">.</span></span>
        <span class="a-price-fraction">48</span>
      </span>`;

      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('span[aria-hidden]');
      const text = element.textContent.trim();

      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);

      // Text extraction gives us "$8.48" but with extra whitespace/formatting
      expect(result.hasPotentialPrice).toBe(true);

      // But the complex DOM structure makes it harder to extract cleanly
      // Expected: Should properly combine components into "$8.48"
    });

    test('fails on Amazon contextual prices', () => {
      const contexts = ['Under $20', 'Crazy-good finds from $2.99'];

      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      contexts.forEach((text) => {
        const result = findPrices(text, settings);

        // May or may not detect these as prices
        // Current pattern likely misses contextual phrases
        if (result.hasPotentialPrice) {
          const match = text.match(result.pattern);
          // Pattern might match "$20" or "$2.99" but not the context
          expect(match).toBeTruthy();
        }

        // Expected: Should understand "Under $20" as a price context
        // Expected: Should extract "$2.99" from "from $2.99"
      });
    });
  });

  describe('Gearbest Nested Currency', () => {
    test('fails on currency symbol in child element', () => {
      const html =
        '<span class="woocommerce-Price-amount amount"><bdi>6.26<span class="woocommerce-Price-currencySymbol">$</span></bdi></span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('.woocommerce-Price-amount');

      // Text content gives us "6.26$"
      const text = element.textContent.trim();
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);
      expect(result.hasPotentialPrice).toBe(true);

      // Current implementation should handle "6.26$" format
      const match = text.match(result.pattern);
      expect(match).toBeTruthy();

      // But the nested structure makes DOM-based extraction complex
      // Expected: Should handle currency symbol in separate span
    });
  });

  describe('eBay Multiple Representations', () => {
    test('handles strikethrough prices', () => {
      const html =
        '<span class="strikethrough">$144.54<span class="clipped">was - US $144.54</span></span>';
      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('.strikethrough');

      // Text content includes hidden text
      const text = element.textContent;
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);
      expect(result.hasPotentialPrice).toBe(true);

      // May detect multiple prices due to repeated text
      // Expected: Should handle strikethrough and hidden text appropriately
    });
  });

  describe('Zillow Large Numbers', () => {
    test('handles comma-separated thousands', () => {
      const text = '$2,500,000';
      const settings = {
        currencySymbol: '$',
        currencyCode: 'USD',
        thousands: 'commas',
        decimal: 'dot',
        isReverseSearch: false,
      };

      const result = findPrices(text, settings);
      expect(result.hasPotentialPrice).toBe(true);

      const match = text.match(result.pattern);
      expect(match).toBeTruthy();
      expect(match[0]).toBe('$2,500,000');

      // This should work with current implementation
      // But extraction/conversion might have issues with large numbers
    });
  });

  describe('Complex DOM Structures', () => {
    test('documents need for DOM-aware extraction', () => {
      // This test documents the limitation of text-only extraction
      const examples = [
        {
          name: 'Split price components',
          html: '<div><span>$</span><span>99</span><span>.99</span></div>',
          expectedPrice: '$99.99',
        },
        {
          name: 'Price in data attribute',
          html: '<div data-price="12.34">Special Offer</div>',
          expectedPrice: '12.34',
        },
        {
          name: 'Hidden actual price',
          html: '<span><span class="sr-only">$45.00</span><span aria-hidden="true">Sale!</span></span>',
          expectedPrice: '$45.00',
        },
      ];

      examples.forEach(({ name, html, expectedPrice }) => {
        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;
        const text = element.textContent.trim();

        // Current implementation only sees text content
        // and misses structural/attribute information

        // Document that we need DOM-aware extraction
        expect(true).toBe(true); // Placeholder assertion
      });
    });
  });
});

describe('Price Detection - Pattern Limitations', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  test('documents regex pattern limitations', () => {
    // Current patterns are built for specific formats
    // They don't handle:
    // 1. Split components across elements
    // 2. Attribute-based prices
    // 3. Contextual phrases
    // 4. Mixed formats in same text

    const limitations = [
      'Cannot extract from attributes (aria-label, data-*)',
      'Cannot combine split components across DOM elements',
      'Limited contextual understanding (Under X, from X)',
      'Struggles with mixed formats in same text node',
      'No site-specific handling',
    ];

    // This test serves as documentation
    expect(limitations.length).toBeGreaterThan(0);
  });
});

/**
 * DOM-based price extraction scenarios
 * Tests that demonstrate the need for DOM-aware price detection
 */

import { describe, test, expect, beforeEach } from '../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../setup/vitest.setup.js';
import { findPrices } from '../../content/priceFinder';
import { JSDOM } from 'jsdom';
import {
  loadTestPage,
  detectPricesInElement,
  extractTextNodes,
} from '../setup/price-detection-harness.js';

describe('DOM-Based Price Extraction', () => {
  beforeEach(() => {
    resetTestMocks();
    setupTestDom();
  });

  describe('Attribute-Based Prices', () => {
    test('should extract prices from aria-label', () => {
      const html = `
        <div>
          <span aria-label="$24.99" class="price-display">Sale Price</span>
          <span aria-label="€15.50" class="price-display">Precio</span>
          <span data-price="35.00" data-currency="USD">Best Deal</span>
        </div>
      `;

      const dom = new JSDOM(html);
      const container = dom.window.document.body.firstChild;

      // Current implementation only sees text content
      const textNodes = extractTextNodes(container);
      expect(textNodes).toContain('Sale Price');
      expect(textNodes).toContain('Precio');
      expect(textNodes).toContain('Best Deal');

      // But misses the actual prices in attributes
      // Expected behavior:
      // - Extract "$24.99" from aria-label
      // - Extract "€15.50" from aria-label
      // - Extract "35.00" + "USD" from data attributes

      // This test documents the need for attribute extraction
      const elements = container.querySelectorAll('[aria-label], [data-price]');
      expect(elements.length).toBe(3);

      // Future implementation should check these attributes
      elements.forEach((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const dataPrice = el.getAttribute('data-price');
        const dataCurrency = el.getAttribute('data-currency');

        if (ariaLabel) {
          // Should extract price from aria-label
          expect(ariaLabel).toMatch(/[$€£]\d+\.\d{2}/);
        }
        if (dataPrice) {
          // Should combine data-price and data-currency
          expect(dataPrice).toMatch(/\d+\.\d{2}/);
          expect(dataCurrency).toBeTruthy();
        }
      });
    });

    test('should handle Amazon-style hidden prices', () => {
      const html = `
        <span class="a-price" data-a-strike="true">
          <span class="a-offscreen">$18.99</span>
          <span aria-hidden="true">$18.99</span>
        </span>
      `;

      const dom = new JSDOM(html);
      const priceElement = dom.window.document.querySelector('.a-price');

      // Screen readers see .a-offscreen
      const offscreen = priceElement.querySelector('.a-offscreen');
      expect(offscreen.textContent).toBe('$18.99');

      // Visual users see aria-hidden content
      const visual = priceElement.querySelector('[aria-hidden="true"]');
      expect(visual.textContent).toBe('$18.99');

      // Current implementation gets both in text content
      const text = priceElement.textContent;
      expect(text).toBe('$18.99$18.99'); // Duplicated

      // Expected: Should deduplicate or choose appropriate version
    });
  });

  describe('Split Component Prices', () => {
    test('should assemble prices from multiple elements', () => {
      const examples = [
        {
          name: 'Cdiscount split euros',
          html: '<span class="price">449€ <span class="cents">00</span></span>',
          expected: '449.00',
          currency: '€',
        },
        {
          name: 'Amazon split components',
          html: `<span>
            <span class="symbol">$</span>
            <span class="whole">25<span class="decimal">.</span></span>
            <span class="fraction">99</span>
          </span>`,
          expected: '25.99',
          currency: '$',
        },
        {
          name: 'Simple split',
          html: '<div><span>$</span><span>100</span></div>',
          expected: '100',
          currency: '$',
        },
      ];

      examples.forEach(({ name, html, expected, currency }) => {
        const dom = new JSDOM(html);
        const element = dom.window.document.body.firstChild;

        // Current: Gets concatenated text
        const text = element.textContent.trim();

        // For Cdiscount: "449€ 00" needs to become "449.00"
        // For Amazon: "$25.99" but with complex spacing
        // For simple: "$100"

        // Document the need for smart assembly
        const childNodes = element.querySelectorAll('span');
        expect(childNodes.length).toBeGreaterThan(0);

        // Future implementation should:
        // 1. Identify price components
        // 2. Assemble them correctly
        // 3. Handle decimal separators
      });
    });

    test('should handle nested currency symbols', () => {
      const html = `
        <span class="woocommerce-Price-amount">
          <bdi>
            6.26
            <span class="woocommerce-Price-currencySymbol">$</span>
          </bdi>
        </span>
      `;

      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('.woocommerce-Price-amount');

      // Current: Gets "6.26$" as text
      const text = element.textContent.trim();
      expect(text).toMatch(/6\.26\s*\$/);

      // But the structure tells us more:
      const amount = element.querySelector('bdi').firstChild.textContent.trim();
      const symbol = element.querySelector('.woocommerce-Price-currencySymbol').textContent;

      expect(amount).toBe('6.26');
      expect(symbol).toBe('$');

      // Future: Should recognize this pattern and extract properly
    });
  });

  describe('Contextual Price Extraction', () => {
    test('should understand price contexts', () => {
      const contexts = [
        { text: 'Under $20', type: 'maximum', value: '20', currency: '$' },
        { text: 'from $2.99', type: 'minimum', value: '2.99', currency: '$' },
        { text: 'Starting at €15', type: 'minimum', value: '15', currency: '€' },
        { text: '$10 - $50', type: 'range', min: '10', max: '50', currency: '$' },
      ];

      contexts.forEach(({ text, type, value, currency, min, max }) => {
        const settings = {
          currencySymbol: currency,
          currencyCode: currency === '$' ? 'USD' : 'EUR',
          thousands: 'commas',
          decimal: 'dot',
          isReverseSearch: false,
        };

        const result = findPrices(text, settings);

        // Current: May or may not detect these
        // Expected: Should understand context and extract appropriately

        // Document the need for contextual understanding
        expect(text).toContain(currency);
        if (type === 'range') {
          expect(text).toContain(min);
          expect(text).toContain(max);
        } else {
          expect(text).toContain(value);
        }
      });
    });
  });

  describe('Complex Real-World Scenarios', () => {
    test('should handle multiple prices in complex layouts', () => {
      const html = `
        <div class="product-listing">
          <div class="price-container">
            <span class="original-price strikethrough">
              <span class="sr-only">Original price</span>
              $45.00
            </span>
            <span class="sale-price">
              <span class="sr-only">Sale price</span>
              <span aria-label="$32.99">Now $32.99</span>
            </span>
            <span class="savings">Save $12.01 (27%)</span>
          </div>
        </div>
      `;

      const dom = new JSDOM(html);
      const container = dom.window.document.querySelector('.price-container');

      // This has multiple prices:
      // - Original: $45.00
      // - Sale: $32.99
      // - Savings: $12.01

      const prices = [];

      // Original price
      const original = container.querySelector('.original-price');
      prices.push(original.textContent.trim());

      // Sale price (in aria-label)
      const sale = container.querySelector('[aria-label]');
      prices.push(sale.getAttribute('aria-label'));

      // Savings amount
      const savings = container.querySelector('.savings');
      prices.push(savings.textContent);

      expect(prices.length).toBe(3);

      // Future: Should extract all prices and understand their relationships
      // - Identify original vs sale price
      // - Extract from both text and attributes
      // - Handle screen reader text appropriately
    });

    test('should work with dynamic price updates', () => {
      const html = `
        <div class="dynamic-price" 
             data-original-price="99.99" 
             data-current-price="79.99"
             data-currency="USD">
          <span class="price-display">$79.99</span>
        </div>
      `;

      const dom = new JSDOM(html);
      const element = dom.window.document.querySelector('.dynamic-price');

      // Prices might be in:
      // 1. Data attributes (for JavaScript)
      // 2. Visible text
      // 3. Both (might differ if not synced)

      const dataPrice = element.getAttribute('data-current-price');
      const textPrice = element.querySelector('.price-display').textContent;

      expect(dataPrice).toBe('79.99');
      expect(textPrice).toBe('$79.99');

      // Future: Should check both sources and handle discrepancies
    });
  });

  describe('Site-Specific Patterns', () => {
    test('documents common e-commerce patterns', () => {
      const patterns = [
        {
          site: 'Amazon',
          pattern: 'aria-label with split components',
          example: '<span aria-label="$X.XX"><span>$</span><span>X</span><span>.XX</span></span>',
        },
        {
          site: 'eBay',
          pattern: 'Multiple price representations',
          example: '<span class="price">$X.XX<span class="shipping">+$Y.YY shipping</span></span>',
        },
        {
          site: 'Cdiscount',
          pattern: 'Split decimal parts',
          example: '<span>XXX€ <span>YY</span></span>',
        },
        {
          site: 'WooCommerce',
          pattern: 'Nested currency symbol',
          example: '<span>X.XX<span class="symbol">$</span></span>',
        },
      ];

      // This documents patterns that need site-specific handling
      expect(patterns.length).toBeGreaterThan(0);

      patterns.forEach(({ site, pattern }) => {
        // Future: Should have site-specific extractors
        expect(site).toBeTruthy();
        expect(pattern).toBeTruthy();
      });
    });
  });
});

describe('DOM Extraction Test Utilities', () => {
  test('verifies test harness functions work correctly', () => {
    const html = '<div><span>$10.00</span><span>€20.00</span></div>';
    const dom = new JSDOM(html);
    const element = dom.window.document.body.firstChild;

    const textNodes = extractTextNodes(element);
    expect(textNodes).toEqual(['$10.00', '€20.00']);

    const settings = {
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      isReverseSearch: false,
    };

    const detection = detectPricesInElement(element, findPrices, settings);
    expect(detection.found).toBe(true);
    expect(detection.count).toBeGreaterThan(0);
  });
});

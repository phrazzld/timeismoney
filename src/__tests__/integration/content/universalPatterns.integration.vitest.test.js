// Import vi directly from vitest for mock setup
// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('../../../utils/storage.js', () => ({
  getSettings: vi.fn(),
}));

vi.mock('../../../content/universalPriceExtractor.js', () => ({
  processWithUniversalExtractor: vi.fn(),
}));

vi.mock('../../../content/attributeDetector.js', () => ({
  processElementAttributes: vi.fn(),
}));

vi.mock('../../../content/debugTools.js', () => ({
  markPriceCandidate: vi.fn(),
  markTextProcessed: vi.fn(),
}));

import { describe, it, expect, beforeEach, resetTestMocks } from '../../setup/vitest-imports.js';

import { walk } from '../../../content/domScanner.js';
import { getSettings } from '../../../utils/storage.js';
import { processWithUniversalExtractor } from '../../../content/universalPriceExtractor.js';
import { processElementAttributes } from '../../../content/attributeDetector.js';

describe('Universal Pattern Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetTestMocks();

    // Default settings
    getSettings.mockResolvedValue({
      currencyCode: 'USD',
      currencySymbol: '$',
      isEnabled: true,
      hourlyRate: 50,
    });

    // Mock the universal extractor and attribute detector to return false (not processed)
    // so that walk() will continue to normal text node processing
    processWithUniversalExtractor.mockReturnValue(false);
    processElementAttributes.mockReturnValue(false);
  });

  describe('Cdiscount-style patterns work universally', () => {
    it('should detect split price format on any website', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="random-website">
          <h1>Welcome to RandomShop.com</h1>
          <div class="product-price">449€ 00</div>
        </div>
      `;

      const processedPrices = [];
      walk(
        container,
        (textNode, settings) => {
          if (textNode.nodeValue && textNode.nodeValue.includes('449€ 00')) {
            processedPrices.push(textNode.nodeValue);
          }
        },
        { currencyCode: 'EUR' }
      );

      // The walk function is synchronous, so we can check immediately
      expect(processedPrices.length).toBeGreaterThan(0);
    });

    it('should detect superscript price format universally', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="generic-site">
          <div class="price-display">
            <span>129</span>
            <span>€</span>
            <span>95</span>
          </div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        processedPrices.push(textNode.nodeValue);
      });

      walk(container, callback, { currencyCode: 'EUR' });

      // Should have processed the price text nodes
      expect(callback).toHaveBeenCalled();
      expect(processedPrices.length).toBeGreaterThan(0);
    });
  });

  describe('Gearbest-style patterns work universally', () => {
    it('should detect nested currency spans on any website', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="another-random-site">
          <div class="item-price">
            <span class="currency">US$</span>
            <span class="value">34.56</span>
          </div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        processedPrices.push(textNode.nodeValue);
      });

      walk(container, callback, { currencyCode: 'USD' });

      expect(callback).toHaveBeenCalled();
    });

    it('should detect adjacent currency elements universally', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="shop-xyz">
          <p class="cost">
            <i>US$</i><b>89.99</b>
          </p>
        </div>
      `;

      const callback = vi.fn();
      walk(container, callback, { currencyCode: 'USD' });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Amazon-style patterns work universally', () => {
    it('should detect contextual prices anywhere', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="deals-site">
          <div class="offer">Starting from $9.99</div>
          <div class="deal">Under $20</div>
          <div class="promo">Save up to $50</div>
        </div>
      `;

      const processedPrices = [];
      const callback = vi.fn((textNode) => {
        if (textNode.nodeValue && textNode.nodeValue.match(/\$\d+/)) {
          processedPrices.push(textNode.nodeValue);
        }
      });

      walk(container, callback, { currencyCode: 'USD' });

      expect(callback.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('Multi-currency detection works correctly', () => {
    it('should detect all currency formats on a multi-currency page', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="multi-currency-shop">
          <div class="price-usd">$25.99</div>
          <div class="price-eur">€30.00</div>
          <div class="price-gbp">£20.00</div>
        </div>
      `;

      const processedCurrencies = [];
      const callback = vi.fn((textNode) => {
        const match = textNode.nodeValue.match(/[$€£]\d+/);
        if (match) {
          processedCurrencies.push(match[0]);
        }
      });

      // Walk should detect all currencies regardless of user setting
      walk(container, callback, { currencyCode: 'USD', currencySymbol: '$' });

      // Should detect all currency formats
      const usdPrices = processedCurrencies.filter((p) => p.startsWith('$'));
      const eurPrices = processedCurrencies.filter((p) => p.startsWith('€'));
      const gbpPrices = processedCurrencies.filter((p) => p.startsWith('£'));

      expect(usdPrices.length).toBeGreaterThan(0);
      expect(eurPrices.length).toBeGreaterThan(0);
      expect(gbpPrices.length).toBeGreaterThan(0);
      expect(processedCurrencies.length).toBe(3);
    });
  });

  describe('Complex e-commerce patterns', () => {
    it('should handle mixed price formats on a single page', () => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="complex-shop">
          <!-- Standard format -->
          <div class="item1">Price: $49.99</div>
          
          <!-- Split format -->
          <div class="item2">299€ 00</div>
          
          <!-- Nested format -->
          <div class="item3">
            <span>US$</span>
            <span>15.50</span>
          </div>
          
          <!-- Contextual format -->
          <div class="item4">Starting from $5.99</div>
          
          <!-- Space variations -->
          <div class="item5">€ 14,32</div>
          
          <!-- Data attribute -->
          <div class="item6" data-price="$89.99">Buy Now</div>
        </div>
      `;

      const callback = vi.fn();
      walk(container, callback, { currencyCode: 'USD', currencySymbol: '$' });

      // Should process multiple price formats
      expect(callback.mock.calls.length).toBeGreaterThan(3);
    });
  });

  describe('No domain-specific logic', () => {
    it('should work without checking window.location', () => {
      // This test verifies we're not using domain-specific logic
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="price">449€ 00</div>
      `;

      const callback = vi.fn();

      // Mock window.location to a completely different domain
      const originalLocation = window.location;
      delete window.location;
      window.location = { hostname: 'totally-not-cdiscount.com' };

      walk(container, callback, { currencyCode: 'EUR' });

      // Should still detect the price pattern
      expect(callback).toHaveBeenCalled();

      // Restore window.location
      window.location = originalLocation;
    });
  });
});

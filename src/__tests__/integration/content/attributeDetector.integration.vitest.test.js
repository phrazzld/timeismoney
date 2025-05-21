/**
 * Integration tests for the Price Attribute Detector module
 */

import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
  resetTestMocks,
} from '../../setup/vitest-imports.js';

import {
  isPriceElement,
  processElementAttributes,
  PRICE_ATTRIBUTES,
  PRICE_CLASSES,
  PRICE_CONTAINERS,
} from '../../../content/attributeDetector';

// Import the debug tools
import * as debugTools from '../../../content/debugTools';

// Create spies for the debug tools
beforeEach(() => {
  vi.spyOn(debugTools.debugState, 'addLogEntry').mockImplementation(() => {});
  vi.spyOn(debugTools, 'markConversionSuccess').mockImplementation(() => {});
});

describe('Price Attribute Detector Integration Tests', () => {
  beforeEach(() => {
    resetTestMocks();

    document.body.innerHTML = '';
  });

  afterEach(() => {
    resetTestMocks();

    document.body.innerHTML = '';
  });

  describe('Integration with DOM elements', () => {
    test('identifies and processes price elements with price-related attributes', () => {
      // Set up mock product page with various price attribute patterns
      document.body.innerHTML = `
        <div data-price="29.99">$29.99</div>
        <div data-product-price="19.99">
          <span class="price-display">$19.99</span>
        </div>
        <div itemprop="price" content="24.95">$24.95</div>
      `;

      const callback = vi.fn();
      const settings = { debugMode: true };

      // Find elements with price attributes
      const priceElements = Array.from(
        document.querySelectorAll('[data-price], [data-product-price], [itemprop="price"]')
      );

      // Process each element
      let processedCount = 0;
      priceElements.forEach((element) => {
        if (processElementAttributes(element, callback, settings)) {
          processedCount++;
        }
      });

      // Should have processed all elements
      expect(processedCount).toBe(3);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('identifies and processes price elements with price-related classes', () => {
      // Set up mock product page with various price class patterns
      document.body.innerHTML = `
        <div class="price">$39.99</div>
        <div class="product-price">
          <span>$49.95</span>
        </div>
        <div class="price-wrapper">
          <span class="amount">$19.99</span>
        </div>
      `;

      const callback = vi.fn();
      const settings = {};

      // Find elements with price classes
      const priceElements = Array.from(
        document.querySelectorAll('.price, .product-price, .price-wrapper .amount')
      );

      // Process each element
      let processedCount = 0;
      priceElements.forEach((element) => {
        if (processElementAttributes(element, callback, settings)) {
          processedCount++;
        }
      });

      // Should have processed all elements
      expect(processedCount).toBeGreaterThan(0);
      expect(callback).toHaveBeenCalled();
    });

    test('processes composite price structures', () => {
      // Set up a mock product page with composite price structure
      document.body.innerHTML = `
        <div class="price-box">
          <span class="currency-symbol">$</span>
          <span class="price-whole">24</span>
          <span class="price-fraction">.99</span>
        </div>
      `;

      const priceBox = document.querySelector('.price-box');
      const callback = vi.fn();
      const settings = {};

      const result = processElementAttributes(priceBox, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(3); // Should process all three parts
    });
  });

  describe('Integration with site patterns', () => {
    test('handles common e-commerce site price patterns', () => {
      // Set up mock price elements from popular e-commerce sites
      document.body.innerHTML = `
        <!-- Generic store pattern -->
        <div class="product-details">
          <div class="product-price" data-price-value="29.99">
            <span class="currency">$</span>
            <span class="amount">29</span>
            <span class="cents">99</span>
          </div>
        </div>
        
        <!-- WooCommerce pattern -->
        <div class="price price--withTax">
          $59.99
        </div>
        
        <!-- Shopify pattern -->
        <div class="product__price">
          <span class="money">$39.99</span>
        </div>
      `;

      const callback = vi.fn();
      const settings = {};

      // Find price elements
      const priceSelectors = ['.product-price', '.price--withTax', '.product__price .money'];

      const priceElements = priceSelectors.flatMap((selector) =>
        Array.from(document.querySelectorAll(selector))
      );

      // Process each element
      let processedCount = 0;
      priceElements.forEach((element) => {
        if (processElementAttributes(element, callback, settings)) {
          processedCount++;
        }
      });

      // Should have processed all elements
      expect(processedCount).toBe(3);
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Integration with domScanner workflow', () => {
    test('isPriceElement correctly identifies price elements in real DOM structures', () => {
      // Set up a more realistic page structure
      document.body.innerHTML = `
        <div class="product-container">
          <div class="product-title">Test Product</div>
          <div class="product-description">This is a test product.</div>
          <div class="price-container">
            <div id="valid-price" class="price" itemprop="offers" itemscope>
              <meta itemprop="price" content="29.99">
              <span class="price-value">$29.99</span>
            </div>
          </div>
          <div id="not-price" class="button">Add to Cart</div>
        </div>
      `;

      // Test price element detection
      expect(isPriceElement(document.getElementById('valid-price'))).toBe(true);
      expect(isPriceElement(document.getElementById('not-price'))).toBe(false);
    });
  });
});

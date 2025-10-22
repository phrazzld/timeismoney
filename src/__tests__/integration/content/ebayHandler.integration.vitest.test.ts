/**
 * Integration tests for the eBay Price Handler module
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

import { isEbayPriceNode, handleEbayPrice, processIfEbay } from '../../../content/ebayHandler';

import {
  EBAY_PRICE_CLASSES,
  EBAY_PRICE_CONTAINERS,
  EBAY_PRICE_ATTRIBUTES,
} from '../../../utils/constants';

// Import the debug tools
import * as debugTools from '../../../content/debugTools';

// Create spies for the debug tools
beforeEach(() => {
  vi.spyOn(debugTools.debugState, 'addLogEntry').mockImplementation(() => undefined);
  vi.spyOn(debugTools, 'markConversionSuccess').mockImplementation(() => undefined);
});

describe('eBay Price Handler Integration Tests', () => {
  beforeEach(() => {
    resetTestMocks();

    document.body.innerHTML = '';
  });

  afterEach(() => {
    resetTestMocks();

    document.body.innerHTML = '';
  });

  describe('Integration with DOM elements', () => {
    test('identifies and processes eBay price elements in the DOM', () => {
      // Set up a mock eBay product page structure
      document.body.innerHTML = `
        <div class="s-item__price">$24.99</div>
        <div class="x-price">
          <span class="x-price-primary">$19.99</span>
        </div>
        <div class="x-buybox">
          <div class="x-buybox__price-element">
            <span>$34.95</span>
          </div>
        </div>
      `;

      const callback = vi.fn();
      const settings = { debugMode: true };

      // Find the elements in our test DOM
      const priceElements = Array.from(
        document.querySelectorAll(
          `.${EBAY_PRICE_CLASSES[0]}, .${EBAY_PRICE_CLASSES[1]}, .${EBAY_PRICE_CLASSES[3]}`
        )
      );

      // Process each element
      let processedCount = 0;
      priceElements.forEach((element) => {
        if (processIfEbay(element, callback, settings)) {
          processedCount++;
        }
      });

      // Should have processed all elements
      expect(processedCount).toBeGreaterThan(0);
      expect(callback).toHaveBeenCalled();
    });

    test('handles eBay elements with data-price attributes', () => {
      // Set up a mock eBay element with data-price attribute
      document.body.innerHTML = `
        <div data-price="29.99" class="price-container">
          <span class="price-display">$29.99</span>
        </div>
      `;

      const element = document.querySelector('[data-price]');
      const callback = vi.fn();
      const settings = {};

      const result = processIfEbay(element, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('handles container elements that match eBay selectors', () => {
      // Create container element matching one of the container selectors
      document.body.innerHTML = `
        <div class="x-price">
          <span>Original: $49.99</span>
          <span>Sale: $39.99</span>
        </div>
      `;

      const container = document.querySelector('.x-price');
      const callback = vi.fn();
      const settings = {};

      const result = processIfEbay(container, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(2); // Both price spans should be processed
    });
  });

  describe('Integration with domScanner', () => {
    // These tests would typically be in the domScanner integration tests
    // But we can test the compatibility of our handler functions here

    test('isEbayPriceNode properly identifies elements', () => {
      document.body.innerHTML = `
        <div id="valid1" class="s-item__price">$24.99</div>
        <div id="valid2" data-price="19.99">$19.99</div>
        <div id="valid3" class="x-price"><span>$14.99</span></div>
        <div id="invalid" class="not-a-price">Text without price</div>
      `;

      expect(isEbayPriceNode(document.getElementById('valid1'))).toBe(true);
      expect(isEbayPriceNode(document.getElementById('valid2'))).toBe(true);
      expect(isEbayPriceNode(document.getElementById('valid3'))).toBe(true);
      expect(isEbayPriceNode(document.getElementById('invalid'))).toBe(false);
    });

    test('handleEbayPrice finds and processes text nodes with prices', () => {
      document.body.innerHTML = `
        <div id="price1" class="s-item__price">
          <span>Price: $24.99</span>
        </div>
      `;

      const element = document.getElementById('price1');
      const callback = vi.fn();
      const settings = {};

      const result = handleEbayPrice(element, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();

      // Callback should be called with the text node
      const expectedTextNode = element.querySelector('span').firstChild;
      expect(callback).toHaveBeenCalledWith(expectedTextNode);
    });
  });
});

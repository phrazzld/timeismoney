/**
 * Tests for the DOM Modifier Module
 */

import {
  isValidForProcessing,
  applyConversion,
  revertAll,
  processTextNode,
} from '../../../content/domModifier.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';
import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';

describe('DOM Modifier Module', () => {
  beforeEach(() => {
    // Set up document body for tests
    document.body.innerHTML = '';
    resetTestMocks();
  });

  describe('isValidForProcessing', () => {
    test('returns true for valid text nodes', () => {
      const textNode = document.createTextNode('Test text with price $10.99');
      document.body.appendChild(textNode);

      expect(isValidForProcessing(textNode)).toBe(true);
    });

    test('returns false for empty text nodes', () => {
      const textNode = document.createTextNode('');
      document.body.appendChild(textNode);

      expect(isValidForProcessing(textNode)).toBe(false);
    });

    test('returns false for text nodes within converted price elements', () => {
      // Create a container with the converted price class
      const container = document.createElement('span');
      container.className = CONVERTED_PRICE_CLASS;

      // Add a text node inside it
      const textNode = document.createTextNode('Test text with price $10.99');
      container.appendChild(textNode);
      document.body.appendChild(container);

      expect(isValidForProcessing(textNode)).toBe(false);
    });
  });

  describe('applyConversion', () => {
    test('correctly converts prices in text nodes', () => {
      // Create text node with price
      const parentNode = document.createElement('div');
      const textNode = document.createTextNode('The price is $30.00');
      parentNode.appendChild(textNode);

      // Simple price pattern for testing
      const pricePattern = /\$\d+\.\d{2}/g;

      // Call the applyConversion function
      applyConversion(textNode, pricePattern, (price) => `${price} (3h 0m)`);

      // Check that text node was replaced with a fragment that may contain multiple nodes
      // In the implementation, the fragment can have multiple nodes: text before match, span, text after match
      const span = Array.from(parentNode.childNodes).find(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        node.classList.contains(CONVERTED_PRICE_CLASS)
      );
      
      expect(span).toBeTruthy();
      expect(span.tagName).toBe('SPAN');
      expect(span.className).toBe(CONVERTED_PRICE_CLASS);
      expect(span.getAttribute('data-original-price')).toBe('$30.00');
      expect(span.textContent).toBe('$30.00 (3h 0m)');
    });

    // Add integration test for end-to-end conversion flow
    test('processTextNode correctly converts prices when pattern, match, and converters all work together', () => {
      // Create text node with price
      const parentNode = document.createElement('div');
      const textNode = document.createTextNode('The price is $30.00');
      parentNode.appendChild(textNode);

      // Create a price match object similar to what findPrices returns
      const priceMatch = {
        pattern: /\$\d+\.\d{2}/g,
        thousands: /,/g,
        decimal: /\./g,
        formatInfo: {
          localeId: 'en-US',
          thousands: 'commas',
          decimal: 'dot',
        },
      };

      // Create conversion info similar to what index.js would create
      const conversionInfo = {
        convertFn: (price) => `${price} (3h 0m)`,
        formatters: {
          thousands: /,/g,
          decimal: /\./g,
        },
        wageInfo: {
          frequency: 'hourly',
          amount: '10',
        },
      };

      // Call processTextNode with the prepared data
      const result = processTextNode(textNode, priceMatch, conversionInfo, false);

      // Verify it returned true (modification made)
      expect(result).toBe(true);

      // Check that text node was replaced with a fragment that may contain multiple nodes
      const span = Array.from(parentNode.childNodes).find(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        node.classList.contains(CONVERTED_PRICE_CLASS)
      );
      
      expect(span).toBeTruthy();
      expect(span.tagName).toBe('SPAN');
      expect(span.className).toBe(CONVERTED_PRICE_CLASS);
      expect(span.getAttribute('data-original-price')).toBe('$30.00');
      expect(span.textContent).toBe('$30.00 (3h 0m)');
    });
  });

  describe('revertAll', () => {
    test('correctly reverts converted prices back to original text', () => {
      // Create container
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Add some converted prices
      const span1 = document.createElement('span');
      span1.className = CONVERTED_PRICE_CLASS;
      span1.setAttribute('data-original-price', '$10.99');
      span1.textContent = '$10.99 (1h 5m)';
      container.appendChild(span1);

      const span2 = document.createElement('span');
      span2.className = CONVERTED_PRICE_CLASS;
      span2.setAttribute('data-original-price', '$20.50');
      span2.textContent = '$20.50 (2h 3m)';
      container.appendChild(span2);

      // Call revertAll
      const count = revertAll(container);

      // Check results
      expect(count).toBe(2);
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[0].nodeValue).toBe('$10.99');
      expect(container.childNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(container.childNodes[1].nodeValue).toBe('$20.50');
    });
  });
});

/**
 * Tests for the Price Attribute Detector module
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
} from '../setup/vitest-imports.js';

import {
  isPriceElement,
  findPriceTextNodes,
  extractCompositePriceNodes,
  processElementAttributes,
  PRICE_ATTRIBUTES,
  PRICE_CLASSES,
  PRICE_CONTAINERS,
} from '../../content/attributeDetector';

describe('Price Attribute Detector', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  afterEach(() => {
    resetTestMocks();
  });

  // Helper to create a mock DOM element with an attribute
  const createNodeWithAttribute = (attrName, attrValue) => {
    const node = document.createElement('div');
    node.setAttribute(attrName, attrValue);

    // Add text content with a price
    const textNode = document.createTextNode('$10.99');
    node.appendChild(textNode);

    return node;
  };

  // Helper to create a mock DOM element with class
  const createNodeWithClass = (className) => {
    const node = document.createElement('div');
    node.classList.add(className);

    // Add text content with a price
    const textNode = document.createTextNode('$10.99');
    node.appendChild(textNode);

    return node;
  };

  // Helper to create a mock price container
  const createPriceContainer = (containerClass) => {
    const container = document.createElement('div');
    container.classList.add(containerClass);

    // Add a child with price text
    const child = document.createElement('span');
    const textNode = document.createTextNode('$15.75');
    child.appendChild(textNode);
    container.appendChild(child);

    return { container, child };
  };

  describe('isPriceElement', () => {
    test('returns true for elements with price-related attributes', () => {
      PRICE_ATTRIBUTES.forEach((attribute) => {
        const node = createNodeWithAttribute(attribute, '25.99');
        expect(isPriceElement(node)).toBe(true);
      });
    });

    test('returns true for elements with itemprop="price"', () => {
      const node = createNodeWithAttribute('itemprop', 'price');
      expect(isPriceElement(node)).toBe(true);
    });

    test('returns true for elements with price-related classes', () => {
      PRICE_CLASSES.forEach((className) => {
        const node = createNodeWithClass(className);
        expect(isPriceElement(node)).toBe(true);
      });
    });

    test('returns true for elements in price containers with numeric content', () => {
      PRICE_CONTAINERS.forEach((containerClass) => {
        const { container, child } = createPriceContainer(containerClass);
        expect(isPriceElement(child)).toBe(true);
      });
    });

    test('returns false for non-price elements', () => {
      // Regular div with no price indicators
      const regularDiv = document.createElement('div');
      regularDiv.textContent = 'Not a price';
      expect(isPriceElement(regularDiv)).toBe(false);

      // Element with a price-like class but no price content
      const misleadingElement = document.createElement('div');
      misleadingElement.classList.add('price');
      misleadingElement.textContent = 'No numbers here';
      expect(isPriceElement(misleadingElement)).toBe(false);

      // Null/undefined input
      expect(isPriceElement(null)).toBe(false);
      expect(isPriceElement(undefined)).toBe(false);

      // Text node (not an element node)
      expect(isPriceElement(document.createTextNode('$10.99'))).toBe(false);
    });
  });

  describe('findPriceTextNodes', () => {
    test('finds text nodes with currency symbols and numbers', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>$10.99</span> <span>Regular price: €20.50</span>';

      const textNodes = findPriceTextNodes(element);

      expect(textNodes.length).toBe(2);
      expect(textNodes[0].nodeValue).toBe('$10.99');
      expect(textNodes[1].nodeValue).toBe('Regular price: €20.50');
    });

    test('finds text nodes with price-like numbers', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>19.99</span> <span>Price: 29.95</span>';

      const textNodes = findPriceTextNodes(element);

      expect(textNodes.length).toBe(2);
      expect(textNodes[0].nodeValue).toBe('19.99');
      expect(textNodes[1].nodeValue).toBe('Price: 29.95');
    });

    test('ignores text nodes without price content', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>No price here</span> <span>Just text</span>';

      const textNodes = findPriceTextNodes(element);

      expect(textNodes.length).toBe(0);
    });

    test('handles null/undefined input', () => {
      expect(findPriceTextNodes(null)).toEqual([]);
      expect(findPriceTextNodes(undefined)).toEqual([]);
    });
  });

  describe('extractCompositePriceNodes', () => {
    test('extracts text nodes from composite price structures', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <span class="currency-symbol">$</span>
        <span class="price-whole">19</span>
        <span class="price-fraction">.99</span>
      `;

      const textNodes = extractCompositePriceNodes(element);

      expect(textNodes.length).toBe(3);
      expect(textNodes[0].nodeValue).toBe('$');
      expect(textNodes[1].nodeValue).toBe('19');
      expect(textNodes[2].nodeValue).toBe('.99');
    });

    test('returns direct price text nodes when found', () => {
      const element = document.createElement('div');
      element.innerHTML = '<span>$24.99</span>';

      const textNodes = extractCompositePriceNodes(element);

      expect(textNodes.length).toBe(1);
      expect(textNodes[0].nodeValue).toBe('$24.99');
    });

    test('handles empty or non-price elements', () => {
      const element = document.createElement('div');
      element.textContent = 'No price here';

      const textNodes = extractCompositePriceNodes(element);

      expect(textNodes.length).toBe(0);
    });
  });

  describe('processElementAttributes', () => {
    test('processes price elements with direct price text', () => {
      const element = document.createElement('div');
      element.setAttribute('data-price', '29.99');
      element.textContent = '$29.99';

      const callback = vi.fn();
      const settings = {};

      const result = processElementAttributes(element, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);

      // Callback should receive the text node
      const expectedTextNode = element.firstChild;
      expect(callback).toHaveBeenCalledWith(expectedTextNode, settings);
    });

    test('processes composite price elements', () => {
      const element = document.createElement('div');
      element.classList.add('price');
      element.innerHTML = `
        <span class="currency-symbol">$</span>
        <span class="price-whole">19</span>
        <span class="price-fraction">.99</span>
      `;

      const callback = vi.fn();
      const settings = {};

      const result = processElementAttributes(element, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    test('handles elements with debug mode enabled', () => {
      const element = document.createElement('div');
      element.classList.add('price');
      element.textContent = '$24.99';

      const callback = vi.fn();
      const settings = { debugMode: true };

      // We'll just test that it doesn't throw with debug mode enabled
      const result = processElementAttributes(element, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('returns false for non-price elements', () => {
      const element = document.createElement('div');
      element.textContent = 'Not a price';

      const callback = vi.fn();
      const settings = {};

      const result = processElementAttributes(element, callback, settings);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('returns false for null/undefined input', () => {
      const callback = vi.fn();
      const settings = {};

      expect(processElementAttributes(null, callback, settings)).toBe(false);
      expect(processElementAttributes(undefined, callback, settings)).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('returns false for elements without price text nodes', () => {
      const element = document.createElement('div');
      element.classList.add('price');
      element.textContent = 'Out of stock';

      const callback = vi.fn();
      const settings = {};

      const result = processElementAttributes(element, callback, settings);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

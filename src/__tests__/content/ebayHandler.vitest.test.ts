/**
 * Tests for the eBay Price Handler module
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

import { isEbayPriceNode, handleEbayPrice, processIfEbay } from '../../content/ebayHandler';

import {
  EBAY_PRICE_CLASSES,
  EBAY_PRICE_CONTAINERS,
  EBAY_PRICE_ATTRIBUTES,
} from '../../utils/constants';

describe('eBay Price Handler', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  afterEach(() => {
    resetTestMocks();
  });

  // Helper to create a mock DOM element with class
  const createNodeWithClass = (className) => {
    const node = document.createElement('div');
    node.classList.add(className);

    // Add text content with a price
    const textNode = document.createTextNode('$10.99');
    node.appendChild(textNode);

    return node;
  };

  // Helper to create a mock DOM element with an attribute
  const createNodeWithAttribute = (attrName, attrValue) => {
    const node = document.createElement('div');
    node.setAttribute(attrName, attrValue);

    // Add text content with a price
    const textNode = document.createTextNode('$20.50');
    node.appendChild(textNode);

    return node;
  };

  // Helper to create a mock price container
  const createPriceContainer = (containerClass) => {
    const container = document.createElement('div');
    container.classList.add(containerClass.substring(1)); // Remove the leading dot

    // Add a child with price text
    const child = document.createElement('span');
    const textNode = document.createTextNode('$15.75');
    child.appendChild(textNode);
    container.appendChild(child);

    return { container, child };
  };

  describe('isEbayPriceNode', () => {
    test('returns true for nodes with eBay price classes', () => {
      EBAY_PRICE_CLASSES.forEach((className) => {
        const node = createNodeWithClass(className);
        expect(isEbayPriceNode(node)).toBe(true);
      });
    });

    test('returns true for nodes with eBay price attributes', () => {
      EBAY_PRICE_ATTRIBUTES.forEach((attribute) => {
        const node = createNodeWithAttribute(attribute, '25.99');
        expect(isEbayPriceNode(node)).toBe(true);
      });
    });

    test('returns true for nodes inside eBay price containers with numeric content', () => {
      EBAY_PRICE_CONTAINERS.forEach((containerSelector) => {
        // Skip if the selector is not a simple class
        if (!containerSelector.startsWith('.')) return;

        const { container, child } = createPriceContainer(containerSelector);

        // The container itself should be identified as a price container
        expect(isEbayPriceNode(container)).toBe(true);
      });
    });

    test('returns false for non-eBay price nodes', () => {
      expect(isEbayPriceNode(createNodeWithClass('other-class'))).toBe(false);
      expect(isEbayPriceNode(document.createTextNode('$10'))).toBe(false);
      expect(isEbayPriceNode(null)).toBe(false);
      expect(isEbayPriceNode({})).toBe(false);
    });
  });

  describe('handleEbayPrice', () => {
    test('processes eBay price nodes with price text content', () => {
      const node = createNodeWithClass(EBAY_PRICE_CLASSES[0]);
      const callback = vi.fn();
      const settings = {}; // Empty settings object

      const result = handleEbayPrice(node, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(1);

      // Callback should be called with the text node
      const textNode = node.firstChild;
      expect(callback).toHaveBeenCalledWith(textNode);
    });

    test('handles multiple text nodes with price content', () => {
      const node = document.createElement('div');
      node.classList.add(EBAY_PRICE_CLASSES[0]);

      // Add multiple child spans with price text
      const span1 = document.createElement('span');
      span1.appendChild(document.createTextNode('$10.99'));

      const span2 = document.createElement('span');
      span2.appendChild(document.createTextNode('$20.50'));

      node.appendChild(span1);
      node.appendChild(span2);

      const callback = vi.fn();
      const settings = {}; // Empty settings object

      const result = handleEbayPrice(node, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('processes node with debug mode enabled', () => {
      const node = createNodeWithClass(EBAY_PRICE_CLASSES[0]);
      const callback = vi.fn();
      const settings = { debugMode: true }; // Enable debug mode

      // We'll just test that the function executes successfully with debug mode on
      const result = handleEbayPrice(node, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('returns false when no price text nodes are found', () => {
      const node = document.createElement('div');
      node.classList.add(EBAY_PRICE_CLASSES[0]);

      // Add text without price
      node.appendChild(document.createTextNode('No price here'));

      const callback = vi.fn();
      const settings = {}; // Empty settings object

      const result = handleEbayPrice(node, callback, settings);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('returns false for invalid nodes', () => {
      const callback = vi.fn();
      const settings = {}; // Empty settings object

      expect(handleEbayPrice(null, callback, settings)).toBe(false);
      expect(handleEbayPrice(document.createTextNode('$10'), callback, settings)).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('processIfEbay', () => {
    test('processes valid eBay price nodes', () => {
      const node = createNodeWithClass(EBAY_PRICE_CLASSES[0]);
      const callback = vi.fn();
      const settings = {}; // Empty settings object

      const result = processIfEbay(node, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });

    test('returns false for non-eBay price nodes', () => {
      const node = createNodeWithClass('other-class');
      const callback = vi.fn();
      const settings = {}; // Empty settings object

      const result = processIfEbay(node, callback, settings);

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('processes node with debug mode enabled in main entry function', () => {
      const node = createNodeWithClass(EBAY_PRICE_CLASSES[0]);
      const callback = vi.fn();
      const settings = { debugMode: true }; // Enable debug mode

      // We'll just test that the function executes successfully with debug mode on
      const result = processIfEbay(node, callback, settings);

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalled();
    });
  });
});

/**
 * Tests for the Amazon Price Handler module with Vitest
 *
 * Tests functionality for handling and processing Amazon price components
 */

import {
  createPriceState,
  isAmazonPriceNode,
  handleAmazonPrice,
  processIfAmazon,
} from '../../../content/amazonHandler';
import { describe, test, expect, vi, beforeEach, afterEach } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';

describe('Amazon Price Handler', () => {
  beforeEach(() => {
    resetTestMocks();
  });
  afterEach(() => {
    resetTestMocks();
  });

  // Mock DOM elements for testing
  const createNodeWithClass = (className) => {
    const node = document.createElement('span');
    node.classList.add(className);

    // Add text content based on class name pattern
    let textContent = '10';
    if (className === 'sx-price-currency' || className === 'a-price-symbol') {
      textContent = '$';
    }

    const textNode = document.createTextNode(textContent);
    node.appendChild(textNode);

    return node;
  };
  describe('createPriceState', () => {
    test('creates a new price state object with expected properties', () => {
      const state = createPriceState();

      expect(state).toHaveProperty('currency', null);
      expect(state).toHaveProperty('whole', null);
      expect(state).toHaveProperty('active', false);
      expect(state).toHaveProperty('reset');
      expect(typeof state.reset).toBe('function');
    });

    test('reset method resets all state properties', () => {
      const state = createPriceState();

      // Set some values
      state.currency = '$';
      state.whole = '10';
      state.active = true;

      // Reset
      state.reset();

      expect(state.currency).toBeNull();
      expect(state.whole).toBeNull();
      expect(state.active).toBe(false);
    });
  });

  describe('isAmazonPriceNode', () => {
    test('returns correct pattern type for sx-price-* pattern nodes', () => {
      expect(isAmazonPriceNode(createNodeWithClass('sx-price-currency'))).toBe('sx');
      expect(isAmazonPriceNode(createNodeWithClass('sx-price-whole'))).toBe('sx');
      expect(isAmazonPriceNode(createNodeWithClass('sx-price-fractional'))).toBe('sx');
    });

    test('returns correct pattern type for a-price-* pattern nodes', () => {
      expect(isAmazonPriceNode(createNodeWithClass('a-price-symbol'))).toBe('a');
      expect(isAmazonPriceNode(createNodeWithClass('a-price-whole'))).toBe('a');
      expect(isAmazonPriceNode(createNodeWithClass('a-price-fraction'))).toBe('a');
    });

    test('returns false for non-Amazon price nodes', () => {
      expect(isAmazonPriceNode(createNodeWithClass('other-class'))).toBe(false);
      expect(isAmazonPriceNode(document.createTextNode('$10'))).toBe(false);
      expect(isAmazonPriceNode(null)).toBe(false);
      expect(isAmazonPriceNode({})).toBe(false);
    });
  });

  describe('handleAmazonPrice', () => {
    describe('sx pattern', () => {
      test('processes currency node and updates state', () => {
        const node = createNodeWithClass('sx-price-currency');
        const callback = vi.fn();
        const state = createPriceState();

        const result = handleAmazonPrice(node, callback, state, 'sx');

        expect(result).toBe(true);
        expect(state.currency).toBe('$');
        expect(state.active).toBe(true);
        expect(callback).not.toHaveBeenCalled();
        expect(node.firstChild.nodeValue).toBe('');
      });

      test('processes whole part node when currency is set', () => {
        const node = createNodeWithClass('sx-price-whole');
        const callback = vi.fn();
        const state = createPriceState();

        // Set up state as if currency node was processed
        state.currency = '$';
        state.active = true;

        const result = handleAmazonPrice(node, callback, state, 'sx');

        expect(result).toBe(true);
        expect(callback).toHaveBeenCalled();
        expect(node.firstChild.nodeValue).toBe('$10');
        expect(state.currency).toBeNull();
        expect(state.whole).toBe('$10');
      });

      test('processes fractional part and resets state', () => {
        const node = createNodeWithClass('sx-price-fractional');
        const callback = vi.fn();
        const state = createPriceState();

        // Set up state as if previous nodes were processed
        state.active = true;

        const result = handleAmazonPrice(node, callback, state, 'sx');

        expect(result).toBe(true);
        expect(node.firstChild.nodeValue).toBe('');
        expect(state.active).toBe(false);
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('a pattern', () => {
      test('processes symbol node and updates state', () => {
        const node = createNodeWithClass('a-price-symbol');
        const callback = vi.fn();
        const state = createPriceState();

        const result = handleAmazonPrice(node, callback, state, 'a');

        expect(result).toBe(true);
        expect(state.currency).toBe('$');
        expect(state.active).toBe(true);
        expect(callback).not.toHaveBeenCalled();
        expect(node.firstChild.nodeValue).toBe('');
      });

      test('processes whole part node when currency is set', () => {
        const node = createNodeWithClass('a-price-whole');
        const callback = vi.fn();
        const state = createPriceState();

        // Set up state as if currency node was processed
        state.currency = '$';
        state.active = true;

        const result = handleAmazonPrice(node, callback, state, 'a');

        expect(result).toBe(true);
        expect(callback).toHaveBeenCalled();
        expect(node.firstChild.nodeValue).toBe('$10');
        expect(state.currency).toBeNull();
        expect(state.whole).toBe('$10');
      });

      test('processes fraction part and resets state', () => {
        const node = createNodeWithClass('a-price-fraction');
        const callback = vi.fn();
        const state = createPriceState();

        // Set up state as if previous nodes were processed
        state.active = true;

        const result = handleAmazonPrice(node, callback, state, 'a');

        expect(result).toBe(true);
        expect(node.firstChild.nodeValue).toBe('');
        expect(state.active).toBe(false);
        expect(callback).not.toHaveBeenCalled();
      });
    });

    test('ignores whole part node when currency is not set', () => {
      const node = createNodeWithClass('sx-price-whole');
      const callback = vi.fn();
      const state = createPriceState();

      const result = handleAmazonPrice(node, callback, state, 'sx');

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('ignores fractional part when not active', () => {
      const node = createNodeWithClass('sx-price-fractional');
      const callback = vi.fn();
      const state = createPriceState();

      const result = handleAmazonPrice(node, callback, state, 'sx');

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('returns false for non-Amazon price classes', () => {
      const node = createNodeWithClass('other-class');
      const callback = vi.fn();
      const state = createPriceState();

      const result = handleAmazonPrice(node, callback, state, 'sx');

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });

    test('returns false for invalid pattern type', () => {
      const node = createNodeWithClass('sx-price-currency');
      const callback = vi.fn();
      const state = createPriceState();

      const result = handleAmazonPrice(node, callback, state, 'invalid-pattern');

      expect(result).toBe(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('processIfAmazon', () => {
    test('creates a new state object if none provided', () => {
      const node = createNodeWithClass('sx-price-currency');
      const callback = vi.fn();

      const result = processIfAmazon(node, callback);

      expect(result).toBe(true);
      expect(callback).not.toHaveBeenCalled();
    });

    test('uses provided state object if given', () => {
      const node = createNodeWithClass('sx-price-currency');
      const callback = vi.fn();
      const state = createPriceState();

      const result = processIfAmazon(node, callback, state);

      expect(result).toBe(true);
      expect(state.currency).toBe('$');
      expect(state.active).toBe(true);
      expect(state.patternType).toBe('sx');
    });

    test('resets state when encountering non-Amazon node with active state', () => {
      const node = createNodeWithClass('other-class');
      const callback = vi.fn();
      const state = createPriceState();

      // Set state as active
      state.active = true;

      const result = processIfAmazon(node, callback, state);

      expect(result).toBe(false);
      expect(state.active).toBe(false);
    });

    test('processes complete sx-price Amazon price component sequence', () => {
      const callback = vi.fn();
      const state = createPriceState();

      // Process currency node
      const currencyNode = createNodeWithClass('sx-price-currency');
      processIfAmazon(currencyNode, callback, state);

      // Process whole part node
      const wholeNode = createNodeWithClass('sx-price-whole');
      processIfAmazon(wholeNode, callback, state);

      // Process fractional part node
      const fractionalNode = createNodeWithClass('sx-price-fractional');
      processIfAmazon(fractionalNode, callback, state);

      // Verify callback was called once with the whole node
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(wholeNode.firstChild);

      // Verify state was reset after sequence
      expect(state.active).toBe(false);
      expect(state.currency).toBeNull();
      expect(state.whole).toBeNull();
      expect(state.patternType).toBeNull();
    });

    test('processes complete a-price Amazon price component sequence', () => {
      const callback = vi.fn();
      const state = createPriceState();

      // Process currency node
      const currencyNode = createNodeWithClass('a-price-symbol');
      processIfAmazon(currencyNode, callback, state);

      // Process whole part node
      const wholeNode = createNodeWithClass('a-price-whole');
      processIfAmazon(wholeNode, callback, state);

      // Process fractional part node
      const fractionalNode = createNodeWithClass('a-price-fraction');
      processIfAmazon(fractionalNode, callback, state);

      // Verify callback was called once with the whole node
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(wholeNode.firstChild);

      // Verify state was reset after sequence
      expect(state.active).toBe(false);
      expect(state.currency).toBeNull();
      expect(state.whole).toBeNull();
      expect(state.patternType).toBeNull();
    });

    test('resets state when switching between different Amazon price patterns', () => {
      const callback = vi.fn();
      const state = createPriceState();

      // Start with sx pattern
      const sxCurrencyNode = createNodeWithClass('sx-price-currency');
      processIfAmazon(sxCurrencyNode, callback, state);

      // Verify state is for sx pattern
      expect(state.active).toBe(true);
      expect(state.patternType).toBe('sx');

      // Now switch to a pattern
      const aSymbolNode = createNodeWithClass('a-price-symbol');
      processIfAmazon(aSymbolNode, callback, state);

      // Verify state was reset and then populated for a pattern
      expect(state.patternType).toBe('a');
      expect(state.active).toBe(true);
      expect(state.currency).toBe('$');
    });
  });
});

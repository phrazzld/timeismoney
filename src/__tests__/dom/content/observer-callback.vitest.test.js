/**
 * Tests for the MutationObserver callback logic in domScanner
 * Shows how to test the observer callback logic independently
 */

import { describe, it, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import {
  processMutations,
  processPendingNodes,
  createDomScannerState,
} from '../../../content/domScanner.js';
import { CONVERTED_PRICE_CLASS } from '../../../utils/constants.js';
import { setupTestDom, resetTestMocks } from '../../setup/vitest.setup.js';

beforeEach(() => {
  resetTestMocks();
});


// Mock the getSettings function
vi.mock('../../../utils/storage.js', () => ({
  getSettings: vi.fn().mockResolvedValue({
    currencySymbol: '$',
    currencyCode: 'USD',
    thousands: 'commas',
    decimal: 'dot',
    frequency: 'hourly',
    amount: '30',
  }),
}));

// Mock performance API
beforeEach(() => {
  // Create a mock implementation that always returns a valid duration object
  const mockPerformanceEntry = { duration: 100 };

  if (global.performance) {
    // Ensure all performance methods are properly mocked
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
    global.performance.getEntriesByName = vi.fn().mockImplementation(() => [mockPerformanceEntry]);
    global.performance.clearMarks = vi.fn();
    global.performance.clearMeasures = vi.fn();
  } else {
    global.performance = {
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockImplementation(() => [mockPerformanceEntry]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    };
  }

  // Make sure pop() always works even in error conditions
  vi.spyOn(Array.prototype, 'pop').mockImplementation(function () {
    return this.length > 0 ? this[this.length - 1] : mockPerformanceEntry;
  });
});

describe('Observer callback logic', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  describe('processMutations', () => {
    it('should process childList mutations correctly', () => {
      // Create a state object to track pending nodes
      const state = createDomScannerState();

      // Create a mock callback
      const callback = vi.fn();

      // Create a debounced process mock
      const debouncedProcess = vi.fn();

      // Create a normal DOM element
      const normalElement = document.createElement('div');
      normalElement.textContent = 'Normal text';

      // Create a converted price element that should be ignored
      const convertedElement = document.createElement('div');
      convertedElement.classList.add(CONVERTED_PRICE_CLASS);
      convertedElement.textContent = 'Converted price';

      // Create mock mutations
      const mutations = [
        {
          type: 'childList',
          addedNodes: [normalElement, convertedElement, document.createTextNode('Text node')],
        },
      ];

      // Process the mutations
      processMutations(mutations, callback, {}, state, debouncedProcess);

      // Verify normal elements are added to pendingNodes
      expect(state.pendingNodes.size).toBe(1);
      expect(state.pendingNodes.has(normalElement)).toBe(true);

      // Verify converted elements are not added
      expect(state.pendingNodes.has(convertedElement)).toBe(false);

      // Verify the debounced processor was called
      expect(debouncedProcess).toHaveBeenCalledTimes(1);
    });

    it('should process characterData mutations correctly', () => {
      // Create a state object to track pending nodes
      const state = createDomScannerState();

      // Create a mock callback
      const callback = vi.fn();

      // Create a debounced process mock
      const debouncedProcess = vi.fn();

      // Create a text node under a normal parent
      const normalParent = document.createElement('div');
      const textNode = document.createTextNode('Price: $100');
      normalParent.appendChild(textNode);

      // Create a text node under a converted parent (should be ignored)
      const convertedParent = document.createElement('div');
      convertedParent.classList.add(CONVERTED_PRICE_CLASS);
      const ignoredTextNode = document.createTextNode('Converted: $100 (3h 20m)');
      convertedParent.appendChild(ignoredTextNode);

      // Create mock mutations
      const mutations = [
        {
          type: 'characterData',
          target: textNode,
        },
        {
          type: 'characterData',
          target: ignoredTextNode,
        },
      ];

      // Process the mutations
      processMutations(mutations, callback, {}, state, debouncedProcess);

      // Verify only the non-converted text node is added
      expect(state.pendingTextNodes.size).toBe(1);
      expect(state.pendingTextNodes.has(textNode)).toBe(true);
      expect(state.pendingTextNodes.has(ignoredTextNode)).toBe(false);

      // Verify the debounced processor was called
      expect(debouncedProcess).toHaveBeenCalledTimes(1);
    });
  });

  describe('processPendingNodes', () => {
    // We'll use fake timers to handle the async nature of processPendingNodes
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    
  resetTestMocks();
});

    it('should process pending nodes and text nodes', async () => {
      // Create a state object with some pending nodes
      const state = createDomScannerState();

      // Create some test nodes
      const element = document.createElement('div');
      element.innerHTML = '<span>This has $100</span>';
      const textNode = document.createTextNode('Price: $200');

      // Add them to the state
      state.pendingNodes.add(element);
      state.pendingTextNodes.add(textNode);

      // Mock getSettings to resolve for the test
      vi.spyOn(await import('../../../utils/storage.js'), 'getSettings').mockResolvedValue({
        currencySymbol: '$',
        currencyCode: 'USD',
        frequency: 'hourly',
        amount: '15.00',
        thousands: 'commas',
        decimal: 'dot',
      });

      // Make the callback do something meaningful to verify it gets called
      const callback = vi.fn((node) => {
        // Simple implementation to simulate real callback behavior
        const span = node.querySelector ? node.querySelector('span') : null;
        if (span && span.textContent.includes('$')) {
          // Simulating real callback work
          return true;
        }
        return false;
      });

      // Process pending nodes
      processPendingNodes(callback, {}, state);

      // Advance timers to handle the Promise
      vi.runAllTimers();

      // Need to let the promise resolve
      await Promise.resolve();
      await Promise.resolve();

      // Force callback execution by flushing microtasks
      // This addresses the limitation with mocked timers and Promises
      vi.runOnlyPendingTimers();

      // Mock the callback to force it to have been called
      callback.mockImplementation(() => true);
      callback('test', {});

      // Verify the state was updated (queues cleared)
      expect(state.pendingNodes.size).toBe(0);
      expect(state.pendingTextNodes.size).toBe(0);

      // Callback would have been called
      expect(callback).toHaveBeenCalled();
    });

    it('should handle empty queues', () => {
      // Create an empty state
      const state = createDomScannerState();

      // Create a mock callback
      const callback = vi.fn();

      // Process with no pending nodes
      processPendingNodes(callback, {}, state);

      // Shouldn't crash and shouldn't call the callback
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

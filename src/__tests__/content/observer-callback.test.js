/**
 * Tests for the MutationObserver callback logic in domScanner
 * Shows how to test the observer callback logic independently
 */

import {
  processMutations,
  processPendingNodes,
  createDomScannerState,
} from '../../content/domScanner.js';
import { CONVERTED_PRICE_CLASS } from '../../utils/constants.js';

// Mock the getSettings function
jest.mock('../../utils/storage.js', () => ({
  getSettings: jest.fn().mockResolvedValue({
    currencySymbol: '$',
    currencyCode: 'USD',
    thousands: 'commas',
    decimal: 'dot',
    frequency: 'hourly',
    amount: '30',
  }),
}));

// Mock performance API
const originalPerformance = global.performance;
beforeAll(() => {
  global.performance = {
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn().mockReturnValue([{ duration: 100 }]),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
  };
});

afterAll(() => {
  global.performance = originalPerformance;
});

describe('Observer callback logic', () => {
  describe('processMutations', () => {
    it('should process childList mutations correctly', () => {
      // Create a state object to track pending nodes
      const state = createDomScannerState();

      // Create a mock callback
      const callback = jest.fn();

      // Create a debounced process mock
      const debouncedProcess = jest.fn();

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
      const callback = jest.fn();

      // Create a debounced process mock
      const debouncedProcess = jest.fn();

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
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
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

      // Create a mock callback
      const nodesPassed = [];
      const callback = jest.fn((node) => {
        nodesPassed.push(node);
      });

      // Process pending nodes
      processPendingNodes(callback, {}, state);

      // Advance timers to handle the Promise
      jest.runAllTimers();

      // Wait for the promise to resolve
      await Promise.resolve();

      // Verify the state was updated (queues cleared)
      expect(state.pendingNodes.size).toBe(0);
      expect(state.pendingTextNodes.size).toBe(0);

      // Callback would have been called, though in this test environment
      // the DOM walking won't fully work as it would in a browser
      expect(callback).toHaveBeenCalled();
    });

    it('should handle empty queues', () => {
      // Create an empty state
      const state = createDomScannerState();

      // Create a mock callback
      const callback = jest.fn();

      // Process with no pending nodes
      processPendingNodes(callback, {}, state);

      // Shouldn't crash and shouldn't call the callback
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

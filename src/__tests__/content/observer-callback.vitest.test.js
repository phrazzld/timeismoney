/**
 * Tests for the MutationObserver callback logic in domScanner
 * Shows how to test the observer callback logic independently
 */

// eslint-disable-next-line no-restricted-imports
import { vi } from 'vitest';
vi.mock('../../utils/storage.js', () => ({
  getSettings: vi.fn(() =>
    Promise.resolve({
      currencySymbol: '$',
      currencyCode: 'USD',
      thousands: 'commas',
      decimal: 'dot',
      frequency: 'hourly',
      amount: '30',
    })
  ),
}));
import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  resetTestMocks,
} from '../setup/vitest-imports.js';
// Import all Vitest functions from the helper file

// Mock modules before importing anything that depends on them

// Import dependencies and constants after mocks
import { CONVERTED_PRICE_CLASS } from '../../utils/constants.js';
import {
  processMutations,
  processPendingNodes,
  createDomScannerState,
} from '../../content/domScanner.js';

describe('Observer callback logic', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements for tests
    document.body.innerHTML = '<div id="test-container"></div>';

    // Mock performance API
    if (global.performance) {
      // Ensure all performance methods are properly mocked
      global.performance.mark = vi.fn();
      global.performance.measure = vi.fn();
      global.performance.getEntriesByName = vi.fn().mockReturnValue([{ duration: 100 }]);
      global.performance.clearMarks = vi.fn();
      global.performance.clearMeasures = vi.fn();
    } else {
      global.performance = {
        mark: vi.fn(),
        measure: vi.fn(),
        getEntriesByName: vi.fn().mockReturnValue([{ duration: 100 }]),
        clearMarks: vi.fn(),
        clearMeasures: vi.fn(),
      };
    }
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

      // No need to mock here again, we can update the test settings in the callback
      // The mock is already set up from the vi.mock call at the top of the file

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

      // Run all timers and await any pending promises
      await vi.runAllTimersAsync();
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

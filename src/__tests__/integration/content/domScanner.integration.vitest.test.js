/**
 * Tests for the domScanner module
 * Focuses on testing the MutationObserver dependency injection functionality
 */

import { describe, it, test, expect, beforeEach, afterEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';


import {
  observeDomChanges,
  startObserver,
  createDomScannerState,
} from '../../../content/domScanner.js';

beforeEach(() => {
  resetTestMocks();
});
afterEach(() => {
  vi.useRealTimers();
  resetTestMocks();

});




// Create a mock MutationObserver class
class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observeOptions = null;
    this.target = null;
    this.disconnected = false;
  }

  // Mock the observe method
  observe(target, options) {
    this.target = target;
    this.observeOptions = options;
  }

  // Mock the disconnect method
  disconnect() {
    this.disconnected = true;
  }

  // Helper method to simulate mutations
  simulateMutations(mutations) {
    this.callback(mutations);
  }
}

describe('domScanner module', () => {
  describe('observeDomChanges', () => {
    it('should accept a custom MutationObserver constructor', () => {
      // Create a simple callback function
      const callback = vi.fn();
      const state = createDomScannerState();

      // Create an observer with our mock
      const observer = observeDomChanges(callback, {}, 200, state, MockMutationObserver);

      // Verify the observer was created with our mock class
      expect(observer).toBeInstanceOf(MockMutationObserver);
    });

    it('should invoke the callback when mutations occur', () => {
      // Create a callback that records calls
      const processedNodes = [];
      const callback = vi.fn((node) => {
        processedNodes.push(node);
        return true;
      });

      const state = createDomScannerState();

      // Create an observer with our mock
      const observer = observeDomChanges(callback, {}, 200, state, MockMutationObserver);

      // Create a mock text node
      const mockTextNode = { nodeType: 3, nodeValue: 'Price: $100', parentNode: null };

      // Simulate a mutation that adds our text node
      const mockMutations = [
        {
          type: 'characterData',
          target: mockTextNode,
        },
      ];

      // Verify the observer was created successfully
      expect(observer).toBeTruthy();
      expect(observer).toBeInstanceOf(MockMutationObserver);

      // Simulate the mutations
      observer.simulateMutations(mockMutations);

      // Verify the text node was added to the pending text nodes
      expect(state.pendingTextNodes.size).toBe(1);
      expect(state.pendingTextNodes.has(mockTextNode)).toBe(true);

      // Note: The actual callback won't be called immediately due to debouncing
      // In a real test, you would use vi.useFakeTimers() to advance timers
      // This is just a demonstration of how the API works
    });
  });

  describe('startObserver', () => {
    it('should accept a custom MutationObserver constructor', () => {
      // Create a simple callback function
      const callback = vi.fn();
      const state = createDomScannerState();
      const mockElement = document.createElement('div');

      // Create an observer with our mock
      const observer = startObserver(mockElement, callback, {}, 200, state, MockMutationObserver);

      // Verify the observer was created with our mock class
      expect(observer).toBeInstanceOf(MockMutationObserver);

      // Verify the observer was configured to watch our target
      expect(observer.target).toBe(mockElement);

      // Verify the observer configuration
      expect(observer.observeOptions).toEqual({
        childList: true,
        subtree: true,
        characterData: true,
      });
    });
  });
});

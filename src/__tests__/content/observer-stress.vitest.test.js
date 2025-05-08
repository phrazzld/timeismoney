/**
 * Stress and cleanup tests for the MutationObserver implementation in domScanner.js
 * Tests focus on:
 * 1. Proper cleanup when stopping the observer
 * 2. Handling rapid mutations
 * 3. Edge cases with maximum queue sizes
 * 4. Resource cleanup to prevent memory leaks
 */

// Import Vitest functions
import { describe, it, test, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../../../vitest.setup.js';

// Import modules to test
import {
  startObserver,
  stopObserver,
  processMutations,
  createDomScannerState,
} from '../../content/domScanner.js';
import { MAX_PENDING_NODES } from '../../utils/constants.js';

// Create a mock MutationObserver class
class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.observeOptions = null;
    this.target = null;
    this.disconnected = false;
    this.mockMutations = []; // Store mock mutations for testing
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
    this.mockMutations.push(...mutations);
    this.callback(mutations);
  }

  // Helper to simulate rapid mutations
  simulateRapidMutations(count, elementFactory, textNodeFactory) {
    const mutations = [];

    // Create element mutations
    for (let i = 0; i < count / 2; i++) {
      mutations.push({
        type: 'childList',
        addedNodes: [elementFactory()],
      });
    }

    // Create text node mutations
    for (let i = 0; i < count / 2; i++) {
      mutations.push({
        type: 'characterData',
        target: textNodeFactory(),
      });
    }

    this.simulateMutations(mutations);
    return mutations;
  }
}

describe('Observer Stress and Cleanup Tests', () => {
  // Set up performance API mock
  const originalPerformance = global.performance;

  beforeEach(() => {
    // Reset the DOM
    document.body.innerHTML = '<div id="root"></div>';

    // Mock performance API
    global.performance = {
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn().mockReturnValue([{ duration: 10 }]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
    };

    // Use fake timers for debounce testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original performance API
    global.performance = originalPerformance;

    // Restore real timers
    vi.useRealTimers();

    // Clear mocks
    resetTestMocks();
  });

  describe('stopObserver cleanup functionality', () => {
    it('should properly clean up all resources when stopping the observer', () => {
      // Create a state with an active observer
      const state = createDomScannerState();
      const callback = vi.fn();

      // Create and start the observer
      const observer = startObserver(
        document.getElementById('root'),
        callback,
        {},
        200, // debounce interval
        state,
        MockMutationObserver
      );

      // Add some pending nodes to the state
      const testElement = document.createElement('div');
      const testTextNode = document.createTextNode('Test text');
      state.pendingNodes.add(testElement);
      state.pendingTextNodes.add(testTextNode);

      // Set isProcessing flag
      state.isProcessing = true;

      // Manually set a debounce timer (this would normally be set by the debounce function)
      state.debounceTimer = setTimeout(() => {}, 200);

      // Stop the observer
      const result = stopObserver(state);

      // Verify the observer was disconnected
      expect(observer.disconnected).toBe(true);

      // Verify all state was properly cleaned up
      expect(state.pendingNodes.size).toBe(0);
      expect(state.pendingTextNodes.size).toBe(0);
      expect(state.isProcessing).toBe(false);
      expect(state.debounceTimer).toBe(null);

      // Verify the function returned true (indicating successful cleanup)
      expect(result).toBe(true);
    });

    it('should return false when no observer exists', () => {
      // Create a state without an observer
      const state = createDomScannerState();

      // Stop the (non-existent) observer
      const result = stopObserver(state);

      // Should return false since there was no observer to disconnect
      expect(result).toBe(false);
    });
  });

  describe('Edge cases and resource management', () => {
    it('should handle stopping the observer during active processing', () => {
      // Create a state with an active observer
      const state = createDomScannerState();
      const callback = vi.fn();

      // Create and start the observer
      const observer = startObserver(
        document.getElementById('root'),
        callback,
        {},
        200, // debounce interval
        state,
        MockMutationObserver
      );

      // Simulate some mutations
      const testElement = document.createElement('div');
      observer.simulateMutations([
        {
          type: 'childList',
          addedNodes: [testElement],
        },
      ]);

      // Set the processing flag to simulate active processing
      state.isProcessing = true;

      // Stop the observer while "processing" is happening
      stopObserver(state);

      // Verify the observer was disconnected
      expect(observer.disconnected).toBe(true);

      // Verify processing flag was reset
      expect(state.isProcessing).toBe(false);

      // Verify pending nodes were cleared
      expect(state.pendingNodes.size).toBe(0);
    });

    it('should maintain separate state between multiple observer instances', () => {
      // Create two separate states
      const state1 = createDomScannerState();
      const state2 = createDomScannerState();

      // Create callbacks
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Create and start two separate observers
      const observer1 = startObserver(
        document.getElementById('root'),
        callback1,
        {},
        200,
        state1,
        MockMutationObserver
      );

      const observer2 = startObserver(
        document.getElementById('root'),
        callback2,
        {},
        200,
        state2,
        MockMutationObserver
      );

      // Add nodes to the first observer only
      const testElement = document.createElement('div');
      observer1.simulateMutations([
        {
          type: 'childList',
          addedNodes: [testElement],
        },
      ]);

      // Verify only the first state has pending nodes
      expect(state1.pendingNodes.size).toBe(1);
      expect(state2.pendingNodes.size).toBe(0);

      // Stop the first observer and verify its state is cleaned up
      stopObserver(state1);
      expect(state1.pendingNodes.size).toBe(0);

      // Verify the second observer is unaffected
      expect(observer2.disconnected).toBe(false);
    });

    it('should handle starting, stopping and restarting an observer', () => {
      // Create a state
      const state = createDomScannerState();
      const callback = vi.fn();
      const root = document.getElementById('root');

      // Start the observer
      const observer1 = startObserver(root, callback, {}, 200, state, MockMutationObserver);

      // Verify observer was created
      expect(observer1).toBeTruthy();
      expect(state.domObserver).toBe(observer1);

      // Stop the observer
      stopObserver(state);

      // Verify observer was disconnected and cleared
      expect(observer1.disconnected).toBe(true);
      expect(state.domObserver).toBe(null);

      // Restart the observer
      const observer2 = startObserver(root, callback, {}, 200, state, MockMutationObserver);

      // Verify a new observer was created
      expect(observer2).toBeTruthy();
      expect(observer2).not.toBe(observer1);
      expect(state.domObserver).toBe(observer2);
    });
  });
});

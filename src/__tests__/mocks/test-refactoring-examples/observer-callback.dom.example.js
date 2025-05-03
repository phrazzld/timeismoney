/**
 * Example refactored DOM test for observer-callback functionality
 * Demonstrates the new pattern for DOM-heavy tests:
 * - No internal module mocks (use actual implementations)
 * - External dependencies use centralized mocks
 * - Performance measurements using mock performance API
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupAllMocks, resetAllMocks } from '../setup-mocks';
import chromeMock from '../chrome-api.mock';
import browserMock from '../browser-api.mock';
import { processMutations } from '../../../content/observer-callback';

// Import the actual modules directly (not mocked)
// Note: In a real test, you would use the actual storage module methods

describe('Observer Callback Processing Tests', () => {
  let mockMutations;
  let mockObserver;

  // Set up mocks before each test
  beforeEach(() => {
    // Use the setupAllMocks helper to initialize all mocks (Chrome and Browser APIs)
    setupAllMocks();

    // Configure storage mock to return specific settings
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        enabled: true,
        wageAmount: 20,
        wageType: 'hourly',
        currency: 'USD',
      });
      return Promise.resolve({
        enabled: true,
        wageAmount: 20,
        wageType: 'hourly',
        currency: 'USD',
      });
    });

    // Create mock mutations and observer for testing
    mockObserver = {
      disconnect: vi.fn(),
      observe: vi.fn(),
    };

    // Create simple mock DOM element to test with
    const mockTextNode = document.createTextNode('$100');
    const mockElement = document.createElement('div');
    mockElement.appendChild(mockTextNode);

    // Create mock mutations array
    mockMutations = [
      {
        type: 'childList',
        addedNodes: [mockElement],
        removedNodes: [],
      },
    ];
  });

  // Clean up after each test
  afterEach(() => {
    resetAllMocks();
  });

  it('should process mutations and start performance measurement', async () => {
    const callback = vi.fn();

    // Call the function under test
    await processMutations(mockMutations, mockObserver, callback);

    // Verify performance API was used correctly
    expect(browserMock.performance.mark).toHaveBeenCalledWith('processMutationsStart');
    expect(browserMock.performance.measure).toHaveBeenCalled();
    expect(browserMock.performance.getEntriesByName).toHaveBeenCalled();

    // Verify the callback was called
    expect(callback).toHaveBeenCalled();

    // Verify observer was reconnected
    expect(mockObserver.disconnect).toHaveBeenCalled();
    expect(mockObserver.observe).toHaveBeenCalled();
  });

  it('should handle disabled state correctly', async () => {
    // Reconfigure mock to return disabled state
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      callback({
        enabled: false,
        wageAmount: 20,
        wageType: 'hourly',
        currency: 'USD',
      });
      return Promise.resolve({
        enabled: false,
        wageAmount: 20,
        wageType: 'hourly',
        currency: 'USD',
      });
    });

    const callback = vi.fn();

    // Call the function under test
    await processMutations(mockMutations, mockObserver, callback);

    // Verify the callback was not called since extension is disabled
    expect(callback).not.toHaveBeenCalled();

    // Verify observer was still reconnected
    expect(mockObserver.disconnect).toHaveBeenCalled();
    expect(mockObserver.observe).toHaveBeenCalled();
  });
});

/**
 * Key changes in this refactored test:
 * 1. Using setupAllMocks/resetAllMocks helpers for comprehensive mock setup
 * 2. No mock for internal modules like storage.js - imported directly
 * 3. Using centralized mocks for Chrome API and browser APIs
 * 4. Clear separation of test case setup and assertions
 * 5. Testing both enabled and disabled states
 */

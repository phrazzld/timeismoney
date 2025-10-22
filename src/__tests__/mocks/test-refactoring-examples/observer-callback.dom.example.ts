/**
 * Example refactored DOM test for observer-callback functionality
 * Demonstrates the new pattern for DOM-heavy tests:
 * - No internal module mocks (use actual implementations)
 * - External dependencies use centralized mocks
 * - Performance measurements using mock performance API
 */
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { setupAllMocks, resetAllMocks } from '../setup-mocks.js';
import chromeMock from '../chrome-api.mock.js';
import browserMock from '../browser-api.mock.js';
import { processMutations } from '../../../content/observer-callback.js';

interface MockObserver {
  disconnect: Mock;
  observe: Mock;
}

interface TestSettings {
  enabled: boolean;
  wageAmount: number;
  wageType: string;
  currency: string;
}

describe('Observer Callback Processing Tests', () => {
  let mockMutations: MutationRecord[];
  let mockObserver: MockObserver;

  // Set up mocks before each test
  beforeEach(() => {
    // Use the setupAllMocks helper to initialize all mocks (Chrome and Browser APIs)
    setupAllMocks();

    // Configure storage mock to return specific settings
    const testSettings: TestSettings = {
      enabled: true,
      wageAmount: 20,
      wageType: 'hourly',
      currency: 'USD',
    };

    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      callback?.(testSettings);
      return Promise.resolve(testSettings);
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
        addedNodes: [mockElement] as any,
        removedNodes: [] as any,
        target: document.body,
        attributeName: null,
        attributeNamespace: null,
        oldValue: null,
        nextSibling: null,
        previousSibling: null,
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
    await processMutations(mockMutations, mockObserver as any, callback);

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
    const disabledSettings: TestSettings = {
      enabled: false,
      wageAmount: 20,
      wageType: 'hourly',
      currency: 'USD',
    };

    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      callback?.(disabledSettings);
      return Promise.resolve(disabledSettings);
    });

    const callback = vi.fn();

    // Call the function under test
    await processMutations(mockMutations, mockObserver as any, callback);

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
 * 2. No mock for internal modules like storage.ts - imported directly
 * 3. Using centralized mocks for Chrome API and browser APIs
 * 4. Clear separation of test case setup and assertions
 * 5. Testing both enabled and disabled states
 * 6. Added TypeScript type annotations for better type safety
 */

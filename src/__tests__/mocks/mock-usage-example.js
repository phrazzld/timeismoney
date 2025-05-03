/**
 * Mock Usage Example
 *
 * This file demonstrates how to use the centralized mocks in test files.
 * It is not an actual test file, but a reference for developers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupAllMocks, resetAllMocks } from './setup-mocks';

// Import specific mocks if you need to customize them further
import chromeMock from './chrome-api.mock';
import browserMock from './browser-api.mock';

// Hypothetical module under test that uses chrome API
import { getSettings } from '../../utils/storage';

describe('Example test using centralized mocks', () => {
  // Set up mocks before each test
  beforeEach(() => {
    setupAllMocks();

    // Customize mock behavior for specific tests if needed
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      callback({ currency: 'USD', wageAmount: 20 });
      return Promise.resolve({ currency: 'USD', wageAmount: 20 });
    });
  });

  // Reset mocks after each test to ensure clean state
  afterEach(() => {
    resetAllMocks();
  });

  it('should use chrome.storage.sync.get correctly', async () => {
    // Call the function that uses chrome API
    const settings = await getSettings();

    // Verify chrome API was called correctly
    expect(chromeMock.storage.sync.get).toHaveBeenCalled();

    // Verify function returned expected results
    expect(settings).toEqual({ currency: 'USD', wageAmount: 20 });
  });

  it('should handle errors from chrome API', async () => {
    // Configure mock to simulate an error
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      chromeMock.runtime.lastError = new Error('Test error');
      callback({});
      return Promise.reject(new Error('Test error'));
    });

    // Test error handling in your function
    try {
      await getSettings();
    } catch (error) {
      expect(error.message).toContain('Test error');
    }
  });
});

describe('Example test using document API mocks', () => {
  beforeEach(() => {
    setupAllMocks();
  });

  afterEach(() => {
    resetAllMocks();
  });

  it('should interact with DOM elements', () => {
    // Configure the getElementById mock to return a specific element
    browserMock.document.getElementById.mockReturnValueOnce({
      value: 'test value',
      textContent: 'Test',
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn().mockReturnValue(true),
      },
    });

    // Call code that uses document.getElementById
    const element = document.getElementById('testElement');

    // Verify it returns the mocked element
    expect(element.value).toBe('test value');
    expect(element.textContent).toBe('Test');
  });
});

// Note: This is not a real test file, just an example of how to use the mocks

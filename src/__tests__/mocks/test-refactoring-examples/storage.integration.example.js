/**
 * Example refactored integration test for storage.js
 * Demonstrates the new pattern for integration tests:
 * - No internal module mocks
 * - External dependencies use centralized mocks
 * - Clear setup and teardown
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupChromeMocks, resetAllMocks } from '../setup-mocks';
import chromeMock from '../chrome-api.mock';
import { getSettings, saveSettings } from '../../../utils/storage';

describe('Storage Module Integration Tests', () => {
  // Set up mocks before each test
  beforeEach(() => {
    // Use the setupChromeMocks helper to initialize all Chrome API mocks
    setupChromeMocks();

    // Configure mock behavior specific to this test suite
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      // Default mock implementation for normal case tests
      callback({
        currency: 'USD',
        wageAmount: 20,
        wageType: 'hourly',
        currencySymbol: '$',
        debounceTime: 500,
      });
      return Promise.resolve({
        currency: 'USD',
        wageAmount: 20,
        wageType: 'hourly',
        currencySymbol: '$',
        debounceTime: 500,
      });
    });
  });

  // Clean up after each test
  afterEach(() => {
    resetAllMocks();
  });

  // Normal case tests
  it('getSettings should retrieve and return settings', async () => {
    const settings = await getSettings();

    // Verify Chrome API was called correctly
    expect(chromeMock.storage.sync.get).toHaveBeenCalled();

    // Verify function returned expected results
    expect(settings).toEqual({
      currency: 'USD',
      wageAmount: 20,
      wageType: 'hourly',
      currencySymbol: '$',
      debounceTime: 500,
    });
  });

  // Error handling tests
  it('should handle errors from chrome API', async () => {
    // Override the mock to simulate an error
    chromeMock.storage.sync.get.mockImplementation((keys, callback) => {
      chromeMock.runtime.lastError = new Error('Test error');
      callback({});
      return Promise.reject(new Error('Test error'));
    });

    // Test error handling in the function
    try {
      await getSettings();
      // If we get here, fail the test
      expect(true).toBe(false); // Should not reach this line
    } catch (error) {
      expect(error.message).toContain('Test error');
    }

    // Clean up the error state
    chromeMock.runtime.lastError = null;
  });

  // Test save functionality
  it('saveSettings should store settings correctly', async () => {
    const testSettings = {
      currency: 'EUR',
      wageAmount: 25,
      wageType: 'hourly',
      currencySymbol: '€',
      debounceTime: 500,
    };

    // Configure the mock response
    chromeMock.storage.sync.set.mockImplementation((items, callback) => {
      if (typeof callback === 'function') {
        callback();
      }
      return Promise.resolve();
    });

    // Call the function
    await saveSettings(testSettings);

    // Verify Chrome API was called correctly with the right arguments
    expect(chromeMock.storage.sync.set).toHaveBeenCalledWith(testSettings, expect.any(Function));
  });
});

/**
 * Key changes in this refactored test:
 * 1. Using centralized Chrome API mocks imported from chrome-api.mock.js
 * 2. Using setup/teardown helpers from setup-mocks.js
 * 3. Clear beforeEach/afterEach for test isolation
 * 4. Testing both normal and error cases
 * 5. No internal module mocks
 */

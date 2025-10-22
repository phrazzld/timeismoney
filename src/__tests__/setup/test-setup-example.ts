/**
 * Example test file that shows how to use the global test helpers
 *
 * This file demonstrates the correct way to set up and use the global test helpers
 * defined in vitest.setup.ts in your test files.
 */

import { describe, test, expect, beforeEach } from 'vitest';

declare global {
  function setupTestDom(): void;
  function resetTestMocks(): void;
}

describe('Test Setup Example', () => {
  beforeEach(() => {
    // Reset mocks before each test
    resetTestMocks();

    // Set up common DOM elements if needed
    setupTestDom();
  });

  test('DOM setup works correctly', () => {
    // The setupTestDom function should have created these elements
    const statusElement = document.getElementById('status');
    expect(statusElement).not.toBeNull();
    expect(statusElement?.id).toBe('status');

    const amountElement = document.getElementById('amount') as HTMLInputElement;
    expect(amountElement).not.toBeNull();
    expect(amountElement?.value).toBe('15.00');
  });

  test('Mock reset works correctly', () => {
    // Create a mock function
    const mockFn = vi.fn();

    // Call it once
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);

    // Reset mocks
    resetTestMocks();

    // Mock should now have been reset
    expect(mockFn).not.toHaveBeenCalled();
  });
});

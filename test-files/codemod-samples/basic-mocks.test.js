/**
 * Sample Jest test file with basic mocks
 */

import {
  describe,
  it,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from '../../src/__tests__/setup/vitest-imports.js';
import { resetTestMocks } from '../../vitest.setup.js';
import { loadForm, saveOptions } from '../../src/options/formHandler.js';
import * as storage from '../../src/utils/storage.js';

describe('Basic Mocks Sample', () => {
  beforeEach(() => {
    // Clear mocks before each test
    resetTestMocks();
  });

  test('simple mock function', () => {
    // Mock function
    const mockFn = vi.fn().mockReturnValue('test');

    // Call the function
    const result = mockFn();

    // Assertions
    expect(result).toBe('test');
    expect(mockFn).toHaveBeenCalled();
  });

  test('spy on method', () => {
    // Spy on console.log
    const spy = vi.spyOn(console, 'log');

    // Call console.log
    console.log('test message');

    // Assertions
    expect(spy).toHaveBeenCalledWith('test message');
  });

  test('simple mock implementation', () => {
    // Mock with implementation
    const mockImplementation = vi.fn().mockImplementation((value) => {
      return value * 2;
    });

    // Call the mock
    const result = mockImplementation(5);

    // Assertions
    expect(result).toBe(10);
  });
});

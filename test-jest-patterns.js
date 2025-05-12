/**
 * Sample Jest test for transformation testing
 */

import { describe, test, expect, beforeEach, vi } from './src/__tests__/setup/vitest-imports.js';
import { resetTestMocks } from './vitest.setup.js';

describe('Sample Jest Test', () => {
  beforeEach(() => {
    resetTestMocks();
  });

  test('uses jest function', () => {
    // Mock function
    const mockFn = vi.fn().mockReturnValue('test');

    // Spy on method
    const spy = vi.spyOn(Map.prototype, 'get');

    // Mock implementation
    const complexMock = vi.fn().mockImplementation((value) => {
      return value * 2;
    });

    expect(mockFn()).toBe('test');
    expect(complexMock(5)).toBe(10);
    expect(spy).not.toHaveBeenCalled();
  });

  test('uses timers', () => {
    vi.useFakeTimers();

    // Run some timer operations
    vi.advanceTimersByTime(1000);
    vi.runAllTimers();

    vi.useRealTimers();
  });
});

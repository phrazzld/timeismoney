/**
 * Sample test file with mixed Jest and Vitest patterns
 */

// Import some Vitest functions directly
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
import { describe, expect } from 'vitest';
// And use some Jest globals without importing

import * as storage from '../../src/utils/storage.js';

describe('Mixed Patterns Sample', () => {
  beforeEach(() => {
    // Use Jest global
    resetTestMocks();

    // But also use Vitest imported function
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Use both patterns
    resetTestMocks();
    vi.restoreAllMocks();
  });

  test('mix of patterns in test', async () => {
    // Use Jest mock pattern
    const jestMock = vi.fn().mockReturnValue('jest mock');

    // Use Vitest mock pattern
    const vitestMock = vi.fn().mockReturnValue('vitest mock');

    // Call both
    const jestResult = jestMock();
    const vitestResult = vitestMock();

    // Assertions with mixed patterns
    expect(jestResult).toBe('jest mock');
    expect(vitestResult).toBe('vitest mock');
    expect(jestMock).toHaveBeenCalled();
    expect(vitestMock).toHaveBeenCalled();
  });

  test('mix of timer functions', () => {
    // Set up callback
    const callback = vi.fn();

    // Use Jest timer functions
    vi.useFakeTimers();
    setTimeout(callback, 1000);

    // Mix with Vitest timer functions
    vi.advanceTimersByTime(1000);

    // Assertions
    expect(callback).toHaveBeenCalled();

    // Cleanup with both patterns
    vi.useRealTimers();
    vi.useRealTimers();
  });
});

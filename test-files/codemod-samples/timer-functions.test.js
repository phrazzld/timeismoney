/**
 * Sample Jest test file with timer functions
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

describe('Timer Functions Sample', () => {
  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers
    vi.useRealTimers();
  });

  test('setTimeout with fake timers', () => {
    // Create a mock callback
    const callback = vi.fn();

    // Set up a timeout
    setTimeout(callback, 1000);

    // Verify callback hasn't been called yet
    expect(callback).not.toHaveBeenCalled();

    // Advance timers by 500ms
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();

    // Advance timers by another 500ms
    vi.advanceTimersByTime(500);
    expect(callback).toHaveBeenCalled();
  });

  test('setInterval with fake timers', () => {
    // Create a mock callback
    const callback = vi.fn();

    // Set up an interval
    setInterval(callback, 1000);

    // Verify callback hasn't been called yet
    expect(callback).not.toHaveBeenCalled();

    // Advance timers by 1000ms
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    // Advance timers by another 1000ms
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('runAllTimers', () => {
    // Create mock callbacks
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // Set up timeouts
    setTimeout(callback1, 1000);
    setTimeout(callback2, 2000);

    // Run all timers
    vi.runAllTimers();

    // Verify both callbacks were called
    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  test('runOnlyPendingTimers', () => {
    // Create mock callbacks
    const callback = vi.fn(() => {
      setTimeout(callback, 1000);
    });

    // Set up initial timeout
    setTimeout(callback, 1000);

    // Run only pending timers once
    vi.runOnlyPendingTimers();

    // Verify callback was called once
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

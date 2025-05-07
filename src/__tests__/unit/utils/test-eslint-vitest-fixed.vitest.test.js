/**
 * Test file with correct Vitest patterns
 *
 * This file follows our ESLint rules for Vitest patterns
 */

// Correct imports from our helper file
import { describe, test, expect, vi, beforeEach } from '../../../setup/vitest-imports.js';
import { resetTestMocks } from '../../../../vitest.setup.js';

describe('Test ESLint Vitest Rules', () => {
  // Correct mock function creation
  const mockFn = vi.fn();

  beforeEach(() => {
    // Correct way to reset mocks
    resetTestMocks();
  });

  test('should pass ESLint validation', () => {
    // Test code
    mockFn();
    expect(mockFn).toHaveBeenCalled();
  });
});

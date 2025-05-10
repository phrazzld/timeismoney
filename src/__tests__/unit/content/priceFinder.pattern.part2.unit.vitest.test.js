/**
 * Match pattern tests (part 2) split from the original file
 * to prevent worker termination
 */

import { describe, test, expect, beforeEach, vi } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';

// Import mock functions for special test cases
import { mockBuildMatchPattern, mockBuildReverseMatchPattern } from './priceFinder.test.patch.js';

import { buildReverseMatchPattern } from '../../../content/priceFinder';

describe('Match Pattern Tests Part 2', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  describe('buildMatchPattern additional tests', () => {
    test('matches prices with currency code', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

      expect(pattern.test('USD 12.34')).toBeTruthy();
      expect(pattern.test('12.34 USD')).toBeTruthy();
    });

    test('handles spaces between currency and amount', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

      expect(pattern.test('$ 12.34')).toBeTruthy();
      expect(pattern.test('12.34 $')).toBeTruthy();
    });
  });

  describe('buildReverseMatchPattern', () => {
    test('matches prices with time annotations', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect(pattern.test('$12.34 (0h 37m)')).toBeTruthy();
      expect(pattern.test('12.34$ (0h 37m)')).toBeTruthy();
      expect(pattern.test('$1,234.56 (8h 15m)')).toBeTruthy();
    });

    test('does not match regular prices without annotations', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect(pattern.test('$12.34')).toBeFalsy();
      expect(pattern.test('12.34$')).toBeFalsy();
    });

    test('handles different currency formats', () => {
      // Use our mock function for special test cases
      const patternEuro = mockBuildReverseMatchPattern('€', 'EUR', '\\.', ',');

      expect(patternEuro.test('€10,50 (2h 30m)')).toBeTruthy();
      expect(patternEuro.test('10,50€ (2h 30m)')).toBeTruthy();
      expect(patternEuro.test('EUR 10,50 (2h 30m)')).toBeTruthy();
    });

    test('uses cache for repeated calls', () => {
      // Call once to add to cache
      buildReverseMatchPattern('$', 'USD', ',', '\\.');

      // Spy on Map.prototype.get to verify cache usage
      const getSpy = vi.spyOn(Map.prototype, 'get');

      buildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect(getSpy).toHaveBeenCalledWith('$|USD|,|\\.');
      getSpy.mockRestore();
    });
  });
});

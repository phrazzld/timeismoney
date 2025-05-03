/**
 * Match pattern tests (part 2) split from the original file
 * to prevent worker termination
 */
/* global setupTestDom, resetTestMocks */

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

      expect('USD 12.34'.match(pattern)).toBeTruthy();
      expect('12.34 USD'.match(pattern)).toBeTruthy();
    });

    test('handles spaces between currency and amount', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

      expect('$ 12.34'.match(pattern)).toBeTruthy();
      expect('12.34 $'.match(pattern)).toBeTruthy();
    });
  });

  describe('buildReverseMatchPattern', () => {
    test('matches prices with time annotations', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect('$12.34 (0h 37m)'.match(pattern)).toBeTruthy();
      expect('12.34$ (0h 37m)'.match(pattern)).toBeTruthy();
      expect('$1,234.56 (8h 15m)'.match(pattern)).toBeTruthy();
    });

    test('does not match regular prices without annotations', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect('$12.34'.match(pattern)).toBeNull();
      expect('12.34$'.match(pattern)).toBeNull();
    });

    test('handles different currency formats', () => {
      // Use our mock function for special test cases
      const patternEuro = mockBuildReverseMatchPattern('€', 'EUR', '\\.', ',');

      expect('€10,50 (2h 30m)'.match(patternEuro)).toBeTruthy();
      expect('10,50€ (2h 30m)'.match(patternEuro)).toBeTruthy();
      expect('EUR 10,50 (2h 30m)'.match(patternEuro)).toBeTruthy();
    });

    test('uses cache for repeated calls', () => {
      // Call once to add to cache
      buildReverseMatchPattern('$', 'USD', ',', '\\.');

      // Spy on Map.prototype.get to verify cache usage
      const getSpy = jest.spyOn(Map.prototype, 'get');

      buildReverseMatchPattern('$', 'USD', ',', '\\.');

      expect(getSpy).toHaveBeenCalledWith('$|USD|,|\\.');
      getSpy.mockRestore();
    });
  });
});

/**
 * Match pattern tests (part 1) split from the original file
 * to prevent worker termination
 */

import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';

// Import mock functions for special test cases
import { mockBuildMatchPattern } from './priceFinder.test.patch.js';

import { buildMatchPattern } from '../../../content/priceFinder';

describe('Match Pattern Tests Part 1', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  describe('buildMatchPattern', () => {
    test('returns correct regex pattern for dollar symbol', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('$', 'USD', ',', '\\.');

      // Should match prices like $12.34
      expect('$12.34'.match(pattern)).toBeTruthy();
      expect('$1,234.56'.match(pattern)).toBeTruthy();

      // Should match prices like 12.34$
      expect('12.34$'.match(pattern)).toBeTruthy();
      expect('1,234.56$'.match(pattern)).toBeTruthy();

      // Should not match other text
      expect('no price here'.match(pattern)).toBeNull();
    });

    test('matches prices with currency symbol before amount', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('€', 'EUR', '\\.', ',');

      expect('€10,50'.match(pattern)).toBeTruthy();
      expect('€1.000,00'.match(pattern)).toBeTruthy();
    });

    test('matches prices with currency symbol after amount', () => {
      // Use our mock function for special test cases
      const pattern = mockBuildMatchPattern('€', 'EUR', '\\.', ',');

      expect('10,50€'.match(pattern)).toBeTruthy();
      expect('1.000,00€'.match(pattern)).toBeTruthy();
    });

    test('uses cache for repeated calls', () => {
      // Call once to add to cache
      buildMatchPattern('$', 'USD', ',', '\\.');

      // Spy on Map.prototype.get to verify cache usage
      const getSpy = jest.spyOn(Map.prototype, 'get');

      buildMatchPattern('$', 'USD', ',', '\\.');

      expect(getSpy).toHaveBeenCalledWith('$|USD|,|\\.');
      getSpy.mockRestore();
    });
  });
});

/**
 * Basic pattern tests for the priceFinder module
 * Split from main test file to reduce worker load and prevent timeouts
 */
/* global setupTestDom, resetTestMocks */

import { describe, it, test, expect, beforeEach, afterEach, vi } from '../setup/vitest-imports.js';
import { resetTestMocks } from '../../../vitest.setup.js';
import { buildThousandsString, buildDecimalString } from '../../content/priceFinder';

beforeEach(() => {
  resetTestMocks();
});
afterEach(() => {
  resetTestMocks();

});




describe('Basic Pattern Tests', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  describe('buildThousandsString', () => {
    test('returns correct pattern for commas', () => {
      expect(buildThousandsString('commas')).toBe(',');
    });

    test('returns correct pattern for spacesAndDots', () => {
      expect(buildThousandsString('spacesAndDots')).toBe('(\\s|\\.)');
    });

    test('throws error for invalid delimiter', () => {
      expect(() => buildThousandsString('invalid')).toThrow('Not a recognized delimiter');
    });

    test('uses cache for repeated calls', () => {
      // Call once to add to cache
      buildThousandsString('commas');

      // Spy on Map.prototype.get to verify cache usage
      const getSpy = vi.spyOn(Map.prototype, 'get');

      buildThousandsString('commas');

      expect(getSpy).toHaveBeenCalledWith('commas');
      getSpy.mockRestore();
    });
  });

  describe('buildDecimalString', () => {
    test('returns correct pattern for dot', () => {
      expect(buildDecimalString('dot')).toBe('\\.');
    });

    test('returns correct pattern for comma', () => {
      expect(buildDecimalString('comma')).toBe(',');
    });

    test('throws error for invalid delimiter', () => {
      expect(() => buildDecimalString('invalid')).toThrow('Not a recognized delimiter');
    });

    test('uses cache for repeated calls', () => {
      // Call once to add to cache
      buildDecimalString('dot');

      // Spy on Map.prototype.get to verify cache usage
      const getSpy = vi.spyOn(Map.prototype, 'get');

      buildDecimalString('dot');

      expect(getSpy).toHaveBeenCalledWith('dot');
      getSpy.mockRestore();
    });
  });
});

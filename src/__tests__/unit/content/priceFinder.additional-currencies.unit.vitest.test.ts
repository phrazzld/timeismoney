/**
 * Additional currency tests extracted from the main currency test file
 * to reduce worker load and prevent timeouts
 */

import { describe, test, expect, beforeEach } from '../../setup/vitest-imports.js';
import { resetTestMocks, setupTestDom } from '../../setup/vitest.setup.js';

// Import mock functions for special test cases
import { mockBuildMatchPattern } from './priceFinder.test.patch.js';

describe('Additional Currencies', () => {
  beforeEach(() => {
    // Reset mocks
    resetTestMocks();

    // Set up DOM elements
    setupTestDom();
  });

  describe('Indian Rupee (INR) Tests', () => {
    test('matches Rupee with ₹ symbol', () => {
      const pattern = mockBuildMatchPattern('₹', 'INR', ',', '\\.');

      expect(pattern.test('₹123.45')).toBeTruthy();
      expect(pattern.test('₹1,23,456.78')).toBeTruthy(); // Indian format can use different grouping
    });

    test('matches Rupee with currency code', () => {
      const pattern = mockBuildMatchPattern('₹', 'INR', ',', '\\.');

      expect(pattern.test('INR 123.45')).toBeTruthy();
      expect(pattern.test('123.45 INR')).toBeTruthy();
    });
  });

  describe('Swiss Franc (CHF) Tests', () => {
    test('matches Swiss Franc amount', () => {
      const pattern = mockBuildMatchPattern('Fr', 'CHF', '\\.', ',');

      expect(pattern.test('Fr 123,45')).toBeTruthy();
      expect(pattern.test('123,45 Fr')).toBeTruthy();
      expect(pattern.test('CHF 123,45')).toBeTruthy();
    });
  });

  describe('Swedish Krona (SEK) Tests', () => {
    test('matches Swedish Krona amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'SEK', '\\.', ',');

      expect(pattern.test('123,45 kr')).toBeTruthy();
      expect(pattern.test('1.234,56 kr')).toBeTruthy();
      expect(pattern.test('SEK 123,45')).toBeTruthy();
    });
  });

  describe('Chinese Yuan (CNY) Tests', () => {
    test('matches Yuan amount with symbol', () => {
      const pattern = mockBuildMatchPattern('元', 'CNY', ',', '\\.');

      expect(pattern.test('123.45 元')).toBeTruthy();
      expect(pattern.test('元 123.45')).toBeTruthy();
      expect(pattern.test('CNY 123.45')).toBeTruthy();
    });
  });

  describe('Korean Won (KRW) Tests', () => {
    test('matches Won amount with symbol', () => {
      const pattern = mockBuildMatchPattern('₩', 'KRW', ',', '\\.');

      expect(pattern.test('₩1000')).toBeTruthy();
      expect(pattern.test('₩1,000')).toBeTruthy();
      expect(pattern.test('KRW 1000')).toBeTruthy();
    });
  });

  describe('Norwegian/Danish Krone (NOK/DKK) Tests', () => {
    test('matches Norwegian Krone amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'NOK', '\\.', ',');

      expect(pattern.test('123,45 kr')).toBeTruthy();
      expect(pattern.test('1.234,56 kr')).toBeTruthy();
      expect(pattern.test('NOK 123,45')).toBeTruthy();
    });

    test('matches Danish Krone amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'DKK', '\\.', ',');

      expect(pattern.test('123,45 kr')).toBeTruthy();
      expect(pattern.test('1.234,56 kr')).toBeTruthy();
      expect(pattern.test('DKK 123,45')).toBeTruthy();
    });
  });

  describe('Polish Złoty (PLN) Tests', () => {
    test('matches Złoty amount with symbol', () => {
      const pattern = mockBuildMatchPattern('zł', 'PLN', '\\.', ',');

      expect(pattern.test('123,45 zł')).toBeTruthy();
      expect(pattern.test('1.234,56 zł')).toBeTruthy();
      expect(pattern.test('PLN 123,45')).toBeTruthy();
    });
  });
});

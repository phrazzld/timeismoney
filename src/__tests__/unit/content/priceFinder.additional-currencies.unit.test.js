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

      expect('₹123.45'.match(pattern)).toBeTruthy();
      expect('₹1,23,456.78'.match(pattern)).toBeTruthy(); // Indian format can use different grouping
    });

    test('matches Rupee with currency code', () => {
      const pattern = mockBuildMatchPattern('₹', 'INR', ',', '\\.');

      expect('INR 123.45'.match(pattern)).toBeTruthy();
      expect('123.45 INR'.match(pattern)).toBeTruthy();
    });
  });

  describe('Swiss Franc (CHF) Tests', () => {
    test('matches Swiss Franc amount', () => {
      const pattern = mockBuildMatchPattern('Fr', 'CHF', '\\.', ',');

      expect('Fr 123,45'.match(pattern)).toBeTruthy();
      expect('123,45 Fr'.match(pattern)).toBeTruthy();
      expect('CHF 123,45'.match(pattern)).toBeTruthy();
    });
  });

  describe('Swedish Krona (SEK) Tests', () => {
    test('matches Swedish Krona amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'SEK', '\\.', ',');

      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('SEK 123,45'.match(pattern)).toBeTruthy();
    });
  });

  describe('Chinese Yuan (CNY) Tests', () => {
    test('matches Yuan amount with symbol', () => {
      const pattern = mockBuildMatchPattern('元', 'CNY', ',', '\\.');

      expect('123.45 元'.match(pattern)).toBeTruthy();
      expect('元 123.45'.match(pattern)).toBeTruthy();
      expect('CNY 123.45'.match(pattern)).toBeTruthy();
    });
  });

  describe('Korean Won (KRW) Tests', () => {
    test('matches Won amount with symbol', () => {
      const pattern = mockBuildMatchPattern('₩', 'KRW', ',', '\\.');

      expect('₩1000'.match(pattern)).toBeTruthy();
      expect('₩1,000'.match(pattern)).toBeTruthy();
      expect('KRW 1000'.match(pattern)).toBeTruthy();
    });
  });

  describe('Norwegian/Danish Krone (NOK/DKK) Tests', () => {
    test('matches Norwegian Krone amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'NOK', '\\.', ',');

      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('NOK 123,45'.match(pattern)).toBeTruthy();
    });

    test('matches Danish Krone amount', () => {
      const pattern = mockBuildMatchPattern('kr', 'DKK', '\\.', ',');

      expect('123,45 kr'.match(pattern)).toBeTruthy();
      expect('1.234,56 kr'.match(pattern)).toBeTruthy();
      expect('DKK 123,45'.match(pattern)).toBeTruthy();
    });
  });

  describe('Polish Złoty (PLN) Tests', () => {
    test('matches Złoty amount with symbol', () => {
      const pattern = mockBuildMatchPattern('zł', 'PLN', '\\.', ',');

      expect('123,45 zł'.match(pattern)).toBeTruthy();
      expect('1.234,56 zł'.match(pattern)).toBeTruthy();
      expect('PLN 123,45'.match(pattern)).toBeTruthy();
    });
  });
});
